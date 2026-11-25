import { Route, Routes } from "react-router-dom";

import { DishDetailPage } from "./pages/DishDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QrEntryPage } from "./pages/QrEntryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayMenuPage } from "./pages/TodayMenuPage";
import { WelcomePage } from "./pages/WelcomePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/r/:code" element={<QrEntryPage />} />
      <Route path="/r/:code/today" element={<TodayMenuPage />} />
      <Route path="/dish/:id" element={<DishDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
