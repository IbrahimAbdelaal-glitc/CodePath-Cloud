import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Code2,
  Compass,
  ListChecks,
  Lock,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import PathCard from '../components/PathCard.jsx';
import { ErrorState } from '../components/States.jsx';

export default function Home() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const { data, error, loading, reload } = useFetch('/api/roadmaps?featured=1');
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const steps = [
    { icon: Compass, key: 'step1' },
    { icon: BookOpenCheck, key: 'step2' },
    { icon: ListChecks, key: 'step3' },
    { icon: BarChart3, key: 'step4' },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <svg viewBox="0 0 800 400" preserveAspectRatio="none">
            <path d="M-20 320 C 160 220, 260 380, 420 250 S 700 120, 840 180" />
            <path d="M-20 360 C 200 300, 300 420, 480 300 S 720 220, 840 260" />
          </svg>
        </div>
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">
              <Sparkles size={16} aria-hidden="true" /> {t('home.eyebrow')}
            </span>
            <h1>
              {t('home.titleA')} <mark>{t('home.titleMark')}</mark> {t('home.titleB')}
            </h1>
            <p className="hero__lead">{t('home.lead')}</p>
            <div className="hero__actions">
              <Link to={user ? '/dashboard' : '/register'} className="btn btn--accent btn--lg">
                {user ? t('home.ctaContinue') : t('home.ctaStart')}
                <Arrow size={18} aria-hidden="true" />
              </Link>
              <Link to="/paths" className="btn btn--on-dark btn--lg">
                <Route size={18} aria-hidden="true" />
                {t('home.ctaPaths')}
              </Link>
            </div>
            <ul className="hero__facts">
              <li>{t('home.fact1')}</li>
              <li>{t('home.fact2')}</li>
              <li>{t('home.fact3')}</li>
            </ul>
          </div>

          <div className="hero__card" aria-hidden="true">
            <div className="mini-quiz">
              <span className="chip chip--code_output">{t('questionType.CODE_OUTPUT')}</span>
              <pre dir="ltr">
                <code>
                  <span className="tk-k">const</span> nums = [<span className="tk-n">1</span>, <span className="tk-n">2</span>,{' '}
                  <span className="tk-n">3</span>];{'\n'}console.<span className="tk-f">log</span>(nums.
                  <span className="tk-f">map</span>(n =&gt; n * <span className="tk-n">2</span>).
                  <span className="tk-f">join</span>(<span className="tk-s">&quot;-&quot;</span>));
                </code>
              </pre>
              <div className="mini-quiz__answer" dir="ltr">
                2-4-6
              </div>
              <div className="mini-quiz__ok">✓ {t('home.miniCorrect')}</div>
            </div>
            <div className="mini-stat">
              <Target size={18} />
              <div>
                <strong>{t('home.miniWeak')}</strong>
                <span>{t('home.miniWeakText')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="featured-title">
        <div className="section__head">
          <div>
            <h2 id="featured-title">{t('home.featuredTitle')}</h2>
            <p>{t('home.featuredText')}</p>
          </div>
          <Link to="/paths" className="btn btn--ghost">
            {t('home.allPaths')} <Arrow size={16} aria-hidden="true" />
          </Link>
        </div>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid grid--cards">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton skeleton--card" />
            ))}
          </div>
        ) : (
          <div className="grid grid--cards">
            {data.roadmaps.map((p) => (
              <PathCard key={p.id} path={p} />
            ))}
          </div>
        )}
      </section>

      <section className="section section--tinted" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head section__head--center">
            <div>
              <h2 id="how-title">{t('home.howTitle')}</h2>
              <p>{t('home.howText')}</p>
            </div>
          </div>
          <ol className="steps">
            {steps.map(({ icon: Icon, key }, i) => (
              <li key={key} className="step">
                <span className="step__num">{i + 1}</span>
                <Icon size={26} aria-hidden="true" />
                <h3>{t(`home.${key}Title`)}</h3>
                <p>{t(`home.${key}Text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section container" aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          {t('home.featuresTitle')}
        </h2>
        <div className="features">
          <div className="feature">
            <Code2 size={24} aria-hidden="true" />
            <h3>{t('home.f1Title')}</h3>
            <p>{t('home.f1Text')}</p>
          </div>
          <div className="feature">
            <Target size={24} aria-hidden="true" />
            <h3>{t('home.f2Title')}</h3>
            <p>{t('home.f2Text')}</p>
          </div>
          <div className="feature">
            <Lock size={24} aria-hidden="true" />
            <h3>{t('home.f3Title')}</h3>
            <p>{t('home.f3Text')}</p>
          </div>
        </div>
      </section>

      {!user && (
        <section className="container">
          <div className="cta-band">
            <div>
              <h2>{t('home.ctaBandTitle')}</h2>
              <p>{t('home.ctaBandText')}</p>
            </div>
            <Link to="/register" className="btn btn--accent btn--lg">
              {t('home.ctaBandButton')} <Arrow size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
