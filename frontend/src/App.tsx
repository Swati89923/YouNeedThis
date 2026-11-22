import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import type { Role } from "./api/types";
import Layout from "./components/Layout";
import BrowsePage from "./pages/BrowsePage";
import DashboardPage from "./pages/DashboardPage";
import InboxPage from "./pages/InboxPage";
import LoginPage from "./pages/LoginPage";
import MyFeedbackPage from "./pages/MyFeedbackPage";
import MyProjectsPage from "./pages/MyProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import NotFoundPage from "./pages/NotFoundPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import WalletPage from "./pages/WalletPage";
import WorkPage from "./pages/WorkPage";

/** Sends signed-out visitors to the login page and remembers where they wanted to go. */
function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Layout />;
}

/** Only lets the given role through. Everyone else sees the dashboard. */
function RequireRole({ role }: { role: Role }) {
  const { session } = useAuth();
  if (session?.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        <Route element={<RequireRole role="DEVELOPER" />}>
          <Route path="projects" element={<MyProjectsPage />} />
          <Route path="projects/new" element={<NewProjectPage />} />
          <Route path="inbox" element={<InboxPage />} />
        </Route>

        <Route element={<RequireRole role="REVIEWER" />}>
          <Route path="browse" element={<BrowsePage />} />
          <Route path="work" element={<WorkPage />} />
          <Route path="my-feedback" element={<MyFeedbackPage />} />
          <Route path="wallet" element={<WalletPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
