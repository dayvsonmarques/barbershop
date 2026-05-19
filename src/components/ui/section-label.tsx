import { clsx } from "clsx";

type SectionLabelProps = {
  label: string;
  className?: string;
};

export function SectionLabel({ label, className }: SectionLabelProps) {
  return (
    <p
      className={clsx(
        "text-gold text-xs tracking-[0.25em] font-semibold uppercase mb-3",
        className
      )}
    >
      — {label} —
    </p>
  );
}
