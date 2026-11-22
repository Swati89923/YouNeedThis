import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../api/client";
import type { Role } from "../api/types";
import { useTheme } from "../lib/theme";

type Mode = "login" | "register";

export default function LoginPage() {
  const { session, expired, login, register } = useAuth();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (name.trim().length < 2) return setError("Enter your full name.");
      if (password.length < 8)
        return setError("Use a password with at least 8 characters.");
    }
    if (!email.trim() || !password) {
      return setError("Enter your email and password.");
    }

    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, role);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <button
        className="icon-btn auth-theme"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <section className="auth-hero" aria-hidden="true">
        <h2>Real feedback, fairly paid.</h2>
        <p>
          Developers fund a project once. Verified reviewers test it and write
          structured feedback. Money moves only when the feedback is good.
        </p>
        <ul>
          <li>Escrow holds the payment until you approve</li>
          <li>One review per reviewer, no copy and paste</li>
          <li>Talk to reviewers about their findings</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="muted">
          {mode === "login"
            ? "Sign in to continue."
            : "It takes less than a minute."}
        </p>

        {expired && mode === "login" && (
          <p className="notice" role="status">
            Your session expired. Please sign in again.
          </p>
        )}

        <form onSubmit={submit} noValidate>
          {mode === "register" && (
            <>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <fieldset className="role-pick">
                <legend>I want to</legend>
                <label className={role === "DEVELOPER" ? "role on" : "role"}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "DEVELOPER"}
                    onChange={() => setRole("DEVELOPER")}
                  />
                  <strong>Get feedback</strong>
                  <span>I build apps or sites</span>
                </label>
                <label className={role === "REVIEWER" ? "role on" : "role"}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "REVIEWER"}
                    onChange={() => setRole("REVIEWER")}
                  />
                  <strong>Give feedback</strong>
                  <span>I review and earn</span>
                </label>
              </fieldset>
            </>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <small className="muted">At least 8 characters.</small>
            )}
          </div>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </div>
  );
}
