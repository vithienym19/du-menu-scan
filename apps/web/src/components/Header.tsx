import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@du-menu-scan/shared";
import { ChevronLeft, Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getLanguageInfo } from "../lib/i18n";
import { LanguagePicker } from "./LanguagePicker";

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack = true, onBack }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const currentCode: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const currentLangInfo = getLanguageInfo(currentCode);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-line bg-surface">
        <div className="mx-auto flex h-full max-w-app items-center justify-between gap-2 px-4">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label={t("common.back")}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
              <span>{t("common.back")}</span>
            </button>
          ) : (
            <div className="w-11 shrink-0" aria-hidden="true" />
          )}

          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold text-ink">
            {title}
          </h1>

          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            aria-label={`${t("common.language")}: ${currentLangInfo.nativeName}`}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            <Globe size={20} strokeWidth={2} aria-hidden="true" />
            <span>{currentLangInfo.nativeName}</span>
          </button>
        </div>
      </header>

      <LanguagePicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  );
}
