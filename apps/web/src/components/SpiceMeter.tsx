import type { SpiceLevel } from "@du-menu-scan/shared";
import { useTranslation } from "react-i18next";

export interface SpiceMeterProps {
  level: SpiceLevel;
  className?: string;
}

const DOTS = [0, 1, 2, 3] as const;

export function SpiceMeter({ level, className = "" }: SpiceMeterProps) {
  const { t } = useTranslation();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {DOTS.map((index) => (
          <span
            key={index}
            data-filled={index < level ? "true" : "false"}
            className={`h-2.5 w-2.5 rounded-full ${index < level ? "bg-spice" : "bg-spice-empty"}`}
          />
        ))}
      </span>
      <span className="text-sm font-medium text-ink-muted">{t(`dish.spice.${level}`)}</span>
    </div>
  );
}
