import { Navigate, Route, Routes } from "react-router-dom";

import { readPrefsWithMeta } from "./lib/prefs";
import { CafeteriaChooserPage } from "./pages/CafeteriaChooserPage";
import { DevComponentsPage } from "./pages/DevComponentsPage";
import { DishDetailPage } from "./pages/DishDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QrEntryPage } from "./pages/QrEntryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayMenuPage } from "./pages/TodayMenuPage";
import { WelcomePage } from "./pages/WelcomePage";

function RootRoute() {
  const { prefs, hasStoredData } = readPrefsWithMeta();
  if (!hasStoredData || !prefs.onboarded) {
    return <Navigate to="/welcome" replace />;
  }
  return <CafeteriaChooserPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/r/:code" element={<QrEntryPage />} />
      <Route path="/r/:code/today" element={<TodayMenuPage />} />
      <Route path="/dish/:dishId" element={<DishDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      {import.meta.env.DEV && <Route path="/dev/components" element={<DevComponentsPage />} />}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
