interface P {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}
const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconToday = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconWeek = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const IconMonth = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M3 9h18" />
    <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconStats = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const IconPlus = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconCheck = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);
export const IconClose = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconFlame = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 .5C17 12 15 8 12 3z" />
    <path d="M8.5 11c-1 1.5-1.5 3-1.5 4.5a5 5 0 0 0 10 0c0-1-.2-1.8-.6-2.6" />
  </svg>
);
export const IconSettings = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 9 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);
export const IconTrash = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
export const IconBolt = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
export const IconChevron = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconPalette = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3c.6.7.2 2.7-2.5 2.7z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconTrophy = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
    <path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4M12 13v3M8 20h8M10 16.5h4V20h-4z" />
  </svg>
);
export const IconCopy = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
export const IconDownload = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
  </svg>
);
export const IconUndo = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 8h10a6 6 0 0 1 0 12H8" />
    <path d="M8 4L4 8l4 4" />
  </svg>
);
export const IconSparkles = ({ size, className, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 16l.6 1.7L7.3 18l-1.7.6L5 20.3 4.4 18.6 2.7 18l1.7-.3z" />
  </svg>
);
