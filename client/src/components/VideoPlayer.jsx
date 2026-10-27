import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

// Plays a lesson video (a YouTube clip or an uploaded file) and reports what was actually watched.
// Times passed to callbacks are seconds from the start of the lesson clip.
//   onProgress({ from, to, position })  every ~10 s of playback and on pause/end/leave
//   onTime(position)                    about once a second while playing (used for checkpoints)
//   onEnded()
// The parent can call ref.pause(), ref.play() and ref.seek(seconds).
const REPORT_EVERY = 10;
const SEEK_JUMP = 3;

let ytApi = null;
function loadYouTubeApi() {
  ytApi ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return ytApi;
}

// Turns raw playback times into watched intervals: a jump of more than SEEK_JUMP seconds starts a new interval
function createTracker(report) {
  let segStart = null;
  let last = null;
  let lastReport = 0;
  return {
    tick(t, playing) {
      if (!playing) return;
      if (segStart === null || last === null || t < last - 0.5 || t - last > SEEK_JUMP) {
        if (segStart !== null && last !== null && last > segStart) report(segStart, last, t);
        segStart = t;
      }
      last = t;
      if (t - segStart >= REPORT_EVERY || Date.now() - lastReport > REPORT_EVERY * 1000) {
        if (last > segStart) report(segStart, last, t);
        lastReport = Date.now();
        segStart = t;
      }
    },
    flush(position) {
      if (segStart !== null && last !== null && last > segStart) report(segStart, last, position ?? last);
      else if (position != null) report(null, null, position);
      segStart = null;
      last = null;
    },
  };
}

const VideoPlayer = forwardRef(function VideoPlayer({ video, startAt = 0, onProgress, onTime, onEnded, title }, ref) {
  const { t } = useI18n();
  const hostRef = useRef(null);
  const htmlVideoRef = useRef(null);
  const ytRef = useRef(null);
  const cb = useRef({ onProgress, onTime, onEnded });
  cb.current = { onProgress, onTime, onEnded };
  const clipStart = video.provider === 'YOUTUBE' ? video.start || 0 : 0;

  const tracker = useRef(null);
  tracker.current ??= createTracker((from, to, position) =>
    cb.current.onProgress?.({
      from: from == null ? null : Math.max(0, from - clipStart),
      to: to == null ? null : Math.max(0, to - clipStart),
      position: Math.max(0, position - clipStart),
    }),
  );

  useImperativeHandle(ref, () => ({
    pause() {
      if (ytRef.current?.pauseVideo) ytRef.current.pauseVideo();
      htmlVideoRef.current?.pause();
    },
    play() {
      if (ytRef.current?.playVideo) ytRef.current.playVideo();
      htmlVideoRef.current?.play().catch(() => {});
    },
    seek(seconds) {
      if (ytRef.current?.seekTo) ytRef.current.seekTo(clipStart + seconds, true);
      if (htmlVideoRef.current) htmlVideoRef.current.currentTime = seconds;
    },
  }));

  // YouTube: create the IFrame API player and poll the time while playing
  useEffect(() => {
    if (video.provider !== 'YOUTUBE') return undefined;
    let player;
    let timer;
    let cancelled = false;
    const tr = tracker.current;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const mount = document.createElement('div');
      hostRef.current.replaceChildren(mount);
      player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: video.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          start: Math.floor(clipStart + startAt),
          ...(video.end && { end: video.end }),
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            ytRef.current = e.target;
            e.target.getIframe().setAttribute('title', title || t('player.videoTitle'));
          },
          onStateChange: (e) => {
            const playing = e.data === YT.PlayerState.PLAYING;
            clearInterval(timer);
            if (playing) {
              timer = setInterval(() => {
                const now = player.getCurrentTime();
                tr.tick(now, true);
                cb.current.onTime?.(now - clipStart);
              }, 1000);
            } else {
              tr.flush(player.getCurrentTime?.());
            }
            if (e.data === YT.PlayerState.ENDED) cb.current.onEnded?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      try {
        tr.flush(player?.getCurrentTime?.());
        player?.destroy?.();
      } catch {
        /* player already gone */
      }
      ytRef.current = null;
    };
    // The player is rebuilt only when the video itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.provider, video.youtubeId, video.start, video.end]);

  // Uploaded file: standard <video> element events
  useEffect(() => {
    const el = htmlVideoRef.current;
    if (video.provider !== 'UPLOAD' || !el) return undefined;
    const tr = tracker.current;
    const onTimeUpdate = () => {
      tr.tick(el.currentTime, !el.paused);
      cb.current.onTime?.(el.currentTime);
    };
    const onPause = () => tr.flush(el.currentTime);
    const onEnd = () => {
      tr.flush(el.currentTime);
      cb.current.onEnded?.();
    };
    const onLoaded = () => {
      if (startAt > 0 && startAt < el.duration - 5) el.currentTime = startAt;
    };
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);
    el.addEventListener('loadedmetadata', onLoaded);
    return () => {
      tr.flush(el.currentTime);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('loadedmetadata', onLoaded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.provider, video.url]);

  // Report the last interval when the tab is hidden or closed
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        const now = ytRef.current?.getCurrentTime?.() ?? htmlVideoRef.current?.currentTime;
        tracker.current.flush(now);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  if (video.unavailable) {
    return (
      <div className="video-frame video-frame--empty" role="status">
        <p>{t('player.videoUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="video-frame">
      {video.provider === 'YOUTUBE' ? (
        <div ref={hostRef} className="video-frame__host" />
      ) : (
        <video ref={htmlVideoRef} className="video-frame__host" src={video.url} controls playsInline preload="metadata" aria-label={title}>
          {t('player.noVideoSupport')}
        </video>
      )}
    </div>
  );
});

export default VideoPlayer;
