import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useSession } from "../auth/AuthContext";
import { api } from "../api/endpoints";
import { useTheme } from "../lib/theme";
import { Avatar } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  folder: "M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  inbox: "M4 4h16l2 9v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6zM2 13h5l1 3h8l1-3h5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  briefcase: "M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3",
  chat: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2zM16 14h2",
  bell: "M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0",
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const DEVELOPER_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/projects", label: "My projects", icon: "folder" },
  { to: "/inbox", label: "Feedback inbox", icon: "inbox" },
];

const REVIEWER_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/browse", label: "Browse projects", icon: "search" },
  { to: "/work", label: "My work", icon: "briefcase" },
  { to: "/my-feedback", label: "My feedback", icon: "chat" },
  { to: "/wallet", label: "Wallet", icon: "wallet" },
];

export default function Layout() {
  const session = useSession();
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const nav = session.role === "DEVELOPER" ? DEVELOPER_NAV : REVIEWER_NAV;

  // close the mobile menu after navigating
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // unread badge: refresh on navigation and every 30 seconds
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      api
        .notifications()
        .then((list) => alive && setUnread(list.filter((n) => !n.seen).length))
        .catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [location.pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="28" height="28">
              <rect width="64" height="64" rx="16" fill="currentColor" />
              <path
                d="M18 22a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H31l-9 8v-8h-4z"
                fill="#fff"
              />
            </svg>
          </span>
          <span className="brand-name">Feedback Exchange</span>
        </div>

        <nav aria-label="Main">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={session.name} />
            <div className="me-text">
              <strong>{session.name}</strong>
              <span className="muted">
                {session.role === "DEVELOPER" ? "Developer" : "Reviewer"}
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="topbar-title">Feedback Exchange</span>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <NavLink
              to="/notifications"
              className="icon-btn bell"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            >
              <Icon name="bell" />
              {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
            </NavLink>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {menuOpen && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
