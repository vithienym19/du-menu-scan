import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES, type Language } from "@du-menu-scan/shared";
import { Check, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { changeAppLanguage } from "../lib/i18n";

export interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguagePicker({ isOpen, onClose }: LanguagePickerProps) {
  const { t, i18n } = useTranslation();
  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  const dialogRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const active = document.activeElement;
    triggerElementRef.current = active instanceof HTMLElement ? active : null;

    document.body.classList.add("overflow-hidden");
    selectedButtonRef.current?.focus();

    return () => {
      document.body.classList.remove("overflow-hidden");
      if (triggerElementRef.current && document.contains(triggerElementRef.current)) {
        triggerElementRef.current.focus();
      }
      triggerElementRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (code: Language) => {
    void changeAppLanguage(code);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key === "Tab" && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          !dialogRef.current.contains(document.activeElement)
        ) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (
          document.activeElement === last ||
          !dialogRef.current.contains(document.activeElement)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-picker-title"
        onKeyDown={handleKeyDown}
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

        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const selected = lang.code === currentLang;
            return (
              <li key={lang.code}>
                <button
                  ref={selected ? selectedButtonRef : undefined}
                  type="button"
                  aria-current={selected ? "true" : undefined}
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
