import { DIET_TAGS, SPICE_LEVELS, type WarningStatus } from "@du-menu-scan/shared";

import { AppShell } from "../components/AppShell";
import { HiddenIngredientTag } from "../components/HiddenIngredientTag";
import { IconRow } from "../components/IconRow";
import { SpiceMeter } from "../components/SpiceMeter";
import { WarningBadge } from "../components/WarningBadge";

const WARNING_STATUSES: readonly WarningStatus[] = ["ok", "caution", "avoid", "unverified"];

export function DevComponentsPage() {
  return (
    <AppShell title="Dev: Components" showBack={true}>
      <div className="space-y-6 pb-8">
        <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">WarningBadge</h2>
          <div className="flex flex-wrap items-center gap-2">
            {WARNING_STATUSES.map((status) => (
              <WarningBadge key={status} status={status} showOk={true} />
            ))}
          </div>
          <p className="text-xs font-medium text-ink-subtle">
            Default OK (showOk=false) renders nothing:{" "}
            <span data-testid="ok-hidden-slot">
              <WarningBadge status="ok" />
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">SpiceMeter (0–4)</h2>
          <div className="flex flex-col gap-2">
            {SPICE_LEVELS.map((level) => (
              <SpiceMeter key={level} level={level} />
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">IconRow</h2>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-ink-subtle">
                All diet tags (vegetarian=false)
              </p>
              <IconRow tags={DIET_TAGS} vegetarian={false} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-ink-subtle">
                Vegetarian (vegetarian=true)
              </p>
              <IconRow tags={[]} vegetarian={true} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-ink-subtle">
                Unverified vegetarian (vegetarian=null)
              </p>
              <IconRow tags={["seafood"]} vegetarian={null} />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">HiddenIngredientTag</h2>
          <div className="flex flex-col gap-2">
            <HiddenIngredientTag name="Anchovy broth" />
            <HiddenIngredientTag name="Pork bone broth" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
