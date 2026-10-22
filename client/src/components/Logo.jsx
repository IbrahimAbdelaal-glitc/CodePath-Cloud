export default function Logo({ size = 34 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <path d="M18 40c6-14 22-2 28-16" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="18" cy="40" r="5" fill="#fff" />
      <circle cx="46" cy="24" r="5" fill="#fff" />
    </svg>
  );
}
