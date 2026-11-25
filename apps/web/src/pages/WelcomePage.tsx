import {
  DEFAULT_LANGUAGE,
  DEFAULT_PREFS,
  isLanguage,
  LANGUAGES,
  type Language,
} from "@du-menu-scan/shared";
import { Check, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { changeAppLanguage } from "../lib/i18n";
import { readPrefsWithMeta, writePrefs } from "../lib/prefs";
import { resolveWelcomeNextPath } from "../lib/safePath";

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const validatedNext = resolveWelcomeNextPath(searchParams.get("next"));
  const { prefs, hasStoredData } = readPrefsWithMeta();

  if (hasStoredData && prefs.onboarded) {
    return <Navigate to={validatedNext} replace />;
  }

  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  const handleLanguageSelect = (lang: Language) => {
    void changeAppLanguage(lang);
  };

  const handleSkip = () => {
    writePrefs({
      ...DEFAULT_PREFS,
      lang: currentLang,
      onboarded: true,
    });
    navigate(validatedNext, { replace: true });
  };

  return (
    <AppShell title={t("common.appName")} showBack={false}>
      <div className="space-y-6 pb-8">
        <section className="rounded-md border border-line bg-surface p-5 shadow-card">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-soft text-brand">
            <UtensilsCrossed size={24} strokeWidth={2} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-ink">{t("welcome.title")}</h2>
          <p className="mt-2 text-base text-ink-muted">{t("welcome.subtitle")}</p>
        </section>

        <section
          aria-labelledby="welcome-choose-language"
          className="rounded-md border border-line bg-surface p-4 shadow-card"
        >
          <h3 id="welcome-choose-language" className="text-base font-bold text-ink">
            {t("welcome.chooseLanguage")}
          </h3>

          <ul className="mt-3 flex flex-col gap-2">
            {LANGUAGES.map((lang) => {
              const selected = lang.code === currentLang;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-md border px-4 py-2.5 text-left text-base transition-colors duration-150 ${
                      selected
                        ? "border-brand bg-brand-soft font-semibold text-brand"
                        : "border-line bg-surface font-medium text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    {selected && <Check size={20} strokeWidth={2} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-col gap-2">
          <Link
            to={`/settings?next=${encodeURIComponent(validatedNext)}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand px-4 py-3 text-base font-semibold text-surface hover:bg-brand-strong"
          >
            {t("welcome.setDiet")}
          </Link>

          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 py-2.5 text-base font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            {t("welcome.skip")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
