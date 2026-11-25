import { isLanguage, LANGUAGES, type Language } from "@du-menu-scan/shared";
import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { changeAppLanguage, getLanguageInfo } from "../lib/i18n";

export interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguagePicker({ isOpen, onClose }: LanguagePickerProps) {
  const { t, i18n } = useTranslation();
  const currentLang: Language = isLanguage(i18n.language)
    ? i18n.language
    : getLanguageInfo("en").code;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (code: Language) => {
    void changeAppLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-ink/40 transition-opacity duration-150"
        aria-hidden="true"
        onClick={onClose}
        data-testid="language-picker-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-picker-title"
        className="relative z-10 mx-auto w-full max-w-app rounded-t-lg border-t border-line bg-surface p-4 shadow-sheet transition-transform duration-150"
      >
        <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
          <h2 id="language-picker-title" className="text-lg font-bold text-ink">
            {t("welcome.chooseLanguage")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium text-ink-muted hover:bg-surface-muted"
          >
            <X size={24} strokeWidth={2} aria-hidden="true" />
            <span>{t("common.close")}</span>
          </button>
        </div>

        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto" role="listbox">
          {LANGUAGES.map((lang) => {
            const selected = lang.code === currentLang;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-base transition-colors duration-150 ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-transparent bg-surface font-normal text-ink hover:bg-surface-muted"
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  {selected ? <Check size={20} strokeWidth={2} aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
