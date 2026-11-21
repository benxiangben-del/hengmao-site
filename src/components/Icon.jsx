const paths = {
  search: <><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
  arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  play: <path d="m9 7 8 5-8 5Z"/>,
  pause: <path d="M9 6v12m6-12v12"/>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  shield: <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z"/>,
  tool: <><path d="m14.5 6.5 3-3a5 5 0 0 1-6.4 6.4L4 17l3 3 7.1-7.1a5 5 0 0 1 6.4-6.4l-3 3-3-3Z"/></>,
  book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22Z"/></>,
  folder: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/><path d="M3 10h18"/></>,
  factory: <><path d="M3 21V9l6 3V8l6 4V6l6 3v12Z"/><path d="M7 21v-4h3v4m4 0v-4h3v4"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  previous: <><path d="m15 6-6 6 6 6"/></>,
  next: <><path d="m9 6 6 6-6 6"/></>,
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.arrow}
    </svg>
  );
}
