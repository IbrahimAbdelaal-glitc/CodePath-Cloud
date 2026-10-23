import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext.jsx';
import Logo from './Logo.jsx';

// The printable certificate, shared by the owner's page and the public verification page
export default function CertificateDocument({ certificate: c, credentialLabel }) {
  const { t, fmt } = useI18n();

  const accuracy =
    c.questionsTotal === 0 ? t('certificate.noQuestions') : c.accuracy === null ? t('certificate.noAnswers') : `${fmt.number(c.accuracy)}%`;

  const hours = Math.floor(c.activeMinutes / 60);
  const minutes = c.activeMinutes % 60;
  const activeTime = !c.timeRecorded
    ? t('certificate.timeNotRecorded')
    : c.activeMinutes < 1
      ? t('certificate.underMinute')
      : t('common.hoursAndMinutes', { h: fmt.count('hours', hours), m: fmt.count('minutes', minutes) });
  const timeNote = !c.timeRecorded
    ? t('certificate.timeNotRecordedDetail')
    : c.timeFullyTracked
      ? t('certificate.timeRule')
      : t('certificate.timePartial', { date: fmt.date(c.timeTrackedSince) });

  return (
    <article className="certificate" aria-labelledby="certificate-name">
      <div className="brand certificate__brand">
        <Logo />
        <span className="brand-name" dir="ltr">
          CodePath
        </span>
      </div>

      <p className="certificate__eyebrow">{t('certificate.eyebrow')}</p>
      <p className="certificate__lead">{t('certificate.presentedTo')}</p>
      <h1 id="certificate-name" className="certificate__name">
        {c.studentName}
      </h1>
      <p className="certificate__lead">{t('certificate.completedPath')}</p>
      <p className="certificate__path">
        {c.roadmapSlug ? <Link to={`/paths/${c.roadmapSlug}`}>{c.roadmapTitle}</Link> : c.roadmapTitle}
      </p>

      <dl className="certificate__facts">
        <div>
          <dt>{t('certificate.completionDate')}</dt>
          <dd>{fmt.date(c.completedAt)}</dd>
        </div>
        <div>
          <dt>{t('certificate.accuracy')}</dt>
          <dd>{accuracy}</dd>
          {c.questionsTotal > 0 && (
            <small>
              {t('certificate.accuracyDetail', {
                answered: fmt.number(c.questionsAnswered),
                total: fmt.number(c.questionsTotal),
              })}
            </small>
          )}
        </div>
        <div>
          <dt>{t('certificate.activeTime')}</dt>
          <dd>{activeTime}</dd>
          <small>{timeNote}</small>
        </div>
      </dl>

      <footer className="certificate__foot">
        {credentialLabel ? <span>{credentialLabel}</span> : <span />}
        <span>{t('certificate.issued', { date: fmt.date(c.issuedAt) })}</span>
      </footer>
    </article>
  );
}
