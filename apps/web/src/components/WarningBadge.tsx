import type { WarningStatus } from "@du-menu-scan/shared";
import { Ban, CircleCheck, CircleHelp, type LucideIcon, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface WarningBadgeProps {
  status: WarningStatus;
  /** OK is hidden on menu cards by default and shown on the dish detail page. */
  showOk?: boolean;
  className?: string;
}

interface StatusConfig {
  labelKey: string;
  classes: string;
  Icon: LucideIcon;
}

const STATUS_CONFIG: Record<WarningStatus, StatusConfig> = {
  avoid: {
    labelKey: "status.avoid",
    classes: "bg-avoid-soft text-avoid border-avoid-line",
    Icon: Ban,
  },
  caution: {
    labelKey: "status.caution",
    classes: "bg-caution-soft text-caution border-caution-line",
    Icon: TriangleAlert,
  },
  ok: {
    labelKey: "status.ok",
    classes: "bg-ok-soft text-ok border-transparent",
    Icon: CircleCheck,
  },
  unverified: {
    labelKey: "status.unverified",
    classes: "bg-unverified-soft text-unverified border-unverified-line",
    Icon: CircleHelp,
  },
};

export function WarningBadge({ status, showOk = false, className = "" }: WarningBadgeProps) {
  const { t } = useTranslation();

  if (status === "ok" && !showOk) {
    return null;
  }

  const { labelKey, classes, Icon } = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-sm font-semibold ${classes} ${className}`.trim()}
    >
      <Icon size={16} strokeWidth={2} className="shrink-0" aria-hidden={true} />
      <span>{t(labelKey)}</span>
    </span>
  );
}
