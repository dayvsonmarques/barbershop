import { useState } from "react";

type Props = {
  tooltip: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger" | "success" | "warning";
  children: React.ReactNode;
  disabled?: boolean;
};

const VARIANT_CLASSES: Record<NonNullable<Props["variant"]>, string> = {
  default:  "text-gray-400 hover:text-[#C9A84C] hover:bg-[#FDF8EE]",
  danger:   "text-gray-400 hover:text-red-600 hover:bg-red-50",
  success:  "text-gray-400 hover:text-green-600 hover:bg-green-50",
  warning:  "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50",
};

export function IconButton({ tooltip, onClick, href, variant = "default", children, disabled }: Props) {
  const [show, setShow] = useState(false);

  const classes = `relative inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
    disabled ? "opacity-40 cursor-not-allowed" : VARIANT_CLASSES[variant]
  }`;

  const inner = (
    <>
      {children}
      {show && !disabled && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white z-50 shadow-sm">
          {tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={classes}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label={tooltip}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={classes}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      aria-label={tooltip}
    >
      {inner}
    </button>
  );
}
