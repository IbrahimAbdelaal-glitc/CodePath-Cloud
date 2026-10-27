import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, FileVideo, Upload, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { Alert } from './States.jsx';
import { ProgressBar } from './Badges.jsx';

const MB = 1024 * 1024;

// Reads the duration of a local video file in the browser (no upload needed)
function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement('video');
    el.preload = 'metadata';
    const done = (value) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

// PUT the file straight to object storage with progress events
function putWithProgress(upload, file, onProgress, xhrRef) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open(upload.method, upload.url);
    Object.entries(upload.headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`STORAGE_${xhr.status}`)));
    xhr.onerror = () => reject(new Error('STORAGE_NETWORK'));
    xhr.onabort = () => reject(new Error('ABORTED'));
    xhr.send(file);
  });
}

// "Upload video" for admins and assigned instructors. Permissions are enforced again by the server.
export default function VideoUploadDialog({ initial = {}, onClose, onUploaded }) {
  const { t, fmt } = useI18n();
  const uid = useId();
  const dialogRef = useRef(null);
  const xhrRef = useRef(null);
  const storage = useFetch('/api/manage/storage');
  const roadmaps = useFetch('/api/manage/roadmaps');
  const [target, setTarget] = useState({ roadmapId: initial.roadmapId || '', moduleId: initial.moduleId || '', lessonId: initial.lessonId || '' });
  const detail = useFetch(target.roadmapId ? `/api/manage/roadmaps/${target.roadmapId}` : null);
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | finishing | done
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const uploadId = useRef(null);

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const roadmap = detail.data?.roadmap;
  const module = roadmap?.modules.find((m) => m.id === target.moduleId);
  const busy = phase === 'uploading' || phase === 'finishing';
  const cfg = storage.data;

  const chooseFile = async (e) => {
    const f = e.target.files?.[0] || null;
    setError(null);
    setFile(null);
    setDuration(null);
    if (!f) return;
    if (cfg && !cfg.allowedTypes.includes(f.type)) {
      setError(t('upload.errType', { name: f.name }));
      return;
    }
    if (cfg && f.size > cfg.maxMb * MB) {
      setError(t('upload.errSize', { size: fmt.number(Math.round(f.size / MB)), max: fmt.number(cfg.maxMb) }));
      return;
    }
    setFile(f);
    setDuration(await readDuration(f));
  };

  const start = async (e) => {
    e.preventDefault();
    setError(null);
    if (!target.lessonId) return setError(t('upload.errLesson'));
    if (!file) return setError(t('upload.errFile'));
    setPhase('uploading');
    setProgress(0);
    try {
      const { upload } = await api(`/api/manage/lessons/${target.lessonId}/video-uploads`, {
        method: 'POST',
        body: { fileName: file.name, contentType: file.type, sizeBytes: file.size, durationSeconds: duration },
      });
      uploadId.current = upload.id;
      await putWithProgress(upload, file, setProgress, xhrRef);
      setPhase('finishing');
      await api(`/api/manage/video-uploads/${upload.id}/complete`, { method: 'POST', body: { durationSeconds: duration } });
      setPhase('done');
      uploadId.current = null;
    } catch (err) {
      const id = uploadId.current;
      uploadId.current = null;
      if (id) api(`/api/manage/video-uploads/${id}/abort`, { method: 'POST' }).catch(() => {});
      setPhase('idle');
      if (err.message === 'ABORTED') setError(t('upload.cancelled'));
      else if (err.message === 'STORAGE_NETWORK') setError(t('upload.errNetwork'));
      else if (err.message?.startsWith('STORAGE_')) setError(t('upload.errStorage'));
      else if (err.status === 403) setError(t('upload.errForbidden'));
      else setError(err.message);
    }
  };

  const cancel = () => {
    if (phase === 'uploading') xhrRef.current?.abort();
    else onClose();
  };

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby={`${uid}-title`} onCancel={(e) => (busy ? e.preventDefault() : onClose())}>
      <form className="dialog__body form-stack" onSubmit={start} noValidate>
        <header className="dialog__head">
          <h2 id={`${uid}-title`}>
            <Upload size={20} aria-hidden="true" /> {t('upload.title')}
          </h2>
          <button type="button" className="icon-btn" onClick={cancel} disabled={phase === 'finishing'} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>

        {cfg && !cfg.configured && <Alert type="info">{t('upload.notConfigured')}</Alert>}

        {phase === 'done' ? (
          <div className="state" role="status">
            <CheckCircle2 size={36} className="status-icon status-icon--ok" aria-hidden="true" />
            <p>{t('upload.done')}</p>
            <button type="button" className="btn btn--primary" onClick={onUploaded}>
              {t('upload.finish')}
            </button>
          </div>
        ) : (
          <>
            <p className="muted small">{t('upload.lead')}</p>
            <div className="field">
              <label htmlFor={`${uid}-course`}>{t('upload.course')}</label>
              <select
                id={`${uid}-course`}
                className="input"
                value={target.roadmapId}
                disabled={busy}
                onChange={(e) => setTarget({ roadmapId: e.target.value, moduleId: '', lessonId: '' })}
              >
                <option value="">{t('manage.choosePath')}</option>
                {(roadmaps.data?.roadmaps || [])
                  .filter((r) => r.canEdit)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field field--split">
              <div>
                <label htmlFor={`${uid}-module`}>{t('upload.module')}</label>
                <select
                  id={`${uid}-module`}
                  className="input"
                  value={target.moduleId}
                  disabled={busy || !roadmap}
                  onChange={(e) => setTarget((x) => ({ ...x, moduleId: e.target.value, lessonId: '' }))}
                >
                  <option value="">{t('manage.chooseModule')}</option>
                  {(roadmap?.modules || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${uid}-lesson`}>{t('upload.lesson')}</label>
                <select
                  id={`${uid}-lesson`}
                  className="input"
                  value={target.lessonId}
                  disabled={busy || !module}
                  onChange={(e) => setTarget((x) => ({ ...x, lessonId: e.target.value }))}
                >
                  <option value="">{t('upload.chooseLesson')}</option>
                  {(module?.lessons || []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {roadmap && !roadmap.canEdit && <Alert>{t('upload.errForbidden')}</Alert>}

            <div className="field">
              <label htmlFor={`${uid}-file`}>{t('upload.file')}</label>
              <input
                id={`${uid}-file`}
                type="file"
                className="input"
                accept={cfg?.allowedTypes.join(',') || 'video/*'}
                disabled={busy}
                onChange={chooseFile}
                aria-describedby={`${uid}-file-hint`}
              />
              <span className="hint" id={`${uid}-file-hint`}>
                {t('upload.fileHint', { max: fmt.number(cfg?.maxMb ?? 1024) })}
              </span>
            </div>
            {file && (
              <p className="upload-file">
                <FileVideo size={16} aria-hidden="true" /> {file.name} · {fmt.number(Math.round((file.size / MB) * 10) / 10)} MB
                {duration ? ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : ''}
              </p>
            )}
            {file && !duration && <p className="warn-text">{t('upload.noDuration')}</p>}
            {target.lessonId && <p className="small muted">{t('upload.replaceNote')}</p>}

            {busy && (
              <div aria-live="polite">
                <ProgressBar value={phase === 'finishing' ? 100 : progress} label={t('upload.progressLabel')} />
                <p className="small">{phase === 'finishing' ? t('upload.finishing') : t('upload.progress', { n: progress })}</p>
              </div>
            )}
            {error && <Alert>{error}</Alert>}

            <div className="form-actions">
              <button className="btn btn--primary" disabled={busy || !file || !target.lessonId || (cfg && !cfg.configured)}>
                <Upload size={16} aria-hidden="true" /> {busy ? t('upload.uploading') : t('upload.start')}
              </button>
              <button type="button" className="btn btn--ghost" onClick={cancel} disabled={phase === 'finishing'}>
                {phase === 'uploading' ? t('upload.cancel') : t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}
