import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface HiddenIngredientTagProps {
  name: string;
  className?: string;
}

export function HiddenIngredientTag({ name, className = "" }: HiddenIngredientTagProps) {
  const { t } = useTranslation();

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`.trim()}>
      <TriangleAlert
        size={16}
        strokeWidth={2}
        className="shrink-0 text-caution"
        aria-hidden="true"
      />
      <span className="text-ink-muted">{t("menu.hiddenIngredient", { name })}</span>
    </span>
  );
}
