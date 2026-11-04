import React from 'react';
export function Icon({ name, size = 20 }) {
  const paths = {
    dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    box: 'M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10',
    file: 'M6 3h8l4 4v14H6z M14 3v5h5 M9 12h6 M9 16h6',
    chart: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
    shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
    star: 'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    chat: 'M21 11a9 9 0 01-9 9H4l-3 2 2-7a9 9 0 1118-4z M7 10h10 M7 14h6',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0 M4 22v-3a8 8 0 0116 0v3',
    search: 'M20 20l-5-5 M17 10a7 7 0 11-14 0 7 7 0 0114 0',
    arrow: 'M5 12h14 M14 7l5 5-5 5',
    logout: 'M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5',
    bell: 'M5 16V9a7 7 0 0114 0v7l2 2H3z M10 21h4',
    plus: 'M12 4v16 M4 12h16',
    check: 'M4 12l5 5L20 6',
    clock: 'M12 7v5l3 2 M22 12a10 10 0 11-20 0 10 10 0 0120 0',
    menu: 'M3 6h18 M3 12h18 M3 18h18',
    close: 'M5 5l14 14 M19 5L5 19',
    upload: 'M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6',
    wallet: 'M3 5h17v15H3z M3 5V2h15 M15 11h7v5h-7z',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}
export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">✚</span>
      <span>
        Pharma<span>Link</span>
        <small>PROCUREMENT, CONNECTED.</small>
      </span>
    </div>
  );
}
export function Badge({ children }) {
  return (
    <span className={'badge ' + String(children).toLowerCase().replaceAll('_', '-')}>
      {String(children).replaceAll('_', ' ')}
    </span>
  );
}
export function Empty({ text = 'No records to display.' }) {
  return (
    <div className="empty">
      <Icon name="box" size={32} />
      <p>{text}</p>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={'panel ' + className}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function SimulationBanner() {
  return (
    <div className="simulation">
      <Icon name="shield" size={17} />
      <span>
        Escrow simulation · Demo balances only. No real funds are collected or transferred.
      </span>
    </div>
  );
}
