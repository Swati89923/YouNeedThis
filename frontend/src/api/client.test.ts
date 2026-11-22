import { vi } from "vitest";
import {
  ApiError,
  decodeExpiry,
  loadSession,
  request,
  saveSession,
  setUnauthorizedHandler,
} from "./client";

function jwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `header.${payload}.sig`;
}

function reply(status: number, body: unknown) {
  return Promise.resolve(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe("session storage", () => {
  it("reads the expiry from a token", () => {
    expect(decodeExpiry(jwt(2000000000))).toBe(2000000000 * 1000);
    expect(decodeExpiry("garbage")).toBeNull();
  });

  it("drops an expired session", () => {
    saveSession({ token: jwt(1), email: "a@b.c", name: "A", role: "DEVELOPER" });
    expect(loadSession()).toBeNull();
  });

  it("keeps a valid session", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    saveSession({ token: jwt(future), email: "a@b.c", name: "A", role: "REVIEWER" });
    expect(loadSession()?.role).toBe("REVIEWER");
  });
});

describe("request", () => {
  it("sends the bearer token", async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    saveSession({ token: jwt(future), email: "a@b.c", name: "A", role: "DEVELOPER" });
    const fetchMock = vi.fn(() => reply(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await request("/wallet");

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${jwt(future)}`,
    );
  });

  it("turns server errors into ApiError with the server message", async () => {
    vi.stubGlobal("fetch", () => reply(409, { message: "Already funded" }));
    await expect(request("/x")).rejects.toMatchObject({
      status: 409,
      message: "Already funded",
    });
  });

  it("logs out on 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", () => reply(401, { message: "nope" }));

    await expect(request("/x")).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not log out when a login attempt fails", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", () => reply(401, { message: "Invalid email or password" }));

    await expect(request("/login", { anonymous: true })).rejects.toMatchObject({
      message: "Invalid email or password",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("explains an unreachable server", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("failed")));
    await expect(request("/x")).rejects.toMatchObject({ status: 0 });
  });

  it("handles 204 without a body", async () => {
    vi.stubGlobal("fetch", () => reply(204, undefined));
    await expect(request("/notifications/read-all", { method: "POST" })).resolves.toBeUndefined();
  });
});
