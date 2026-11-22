import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ToastProvider } from "../components/Toast";
import App from "../App";

function mount() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

function json(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

afterEach(() => vi.unstubAllGlobals());

describe("sign in", () => {
  it("sends signed-out visitors to the login page", () => {
    mount();
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("asks for both fields before calling the server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mount();

    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/enter your email and password/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server message for bad credentials", async () => {
    vi.stubGlobal("fetch", () => json(401, { message: "Invalid email or password" }));
    mount();

    await userEvent.type(screen.getByLabelText(/email/i), "dana@demo.dev");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("signs in and lands on the dashboard", async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = `h.${btoa(JSON.stringify({ exp }))}.s`;
    vi.stubGlobal("fetch", (url: string) => {
      if (url.endsWith("/api/v1/auth/login"))
        return json(200, { token, email: "dana@demo.dev", name: "Dana Developer", role: "DEVELOPER" });
      if (url.endsWith("/notifications")) return json(200, []);
      return json(200, {
        totalProjects: 2, totalFeedbacks: 1, pendingReview: 1,
        totalSpent: 0, escrowRemaining: 300, avgRating: 4,
      });
    });
    mount();

    await userEvent.type(screen.getByLabelText(/email/i), "dana@demo.dev");
    await userEvent.type(screen.getByLabelText(/password/i), "Demo@1234");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /hi, dana/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /my projects/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /browse projects/i })).not.toBeInTheDocument();
  });

  it("checks the password length when registering", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mount();

    await userEvent.click(screen.getByRole("button", { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText(/full name/i), "Riya Reviewer");
    await userEvent.type(screen.getByLabelText(/email/i), "riya@demo.dev");
    await userEvent.type(screen.getByLabelText(/password/i), "short");
    await userEvent.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
