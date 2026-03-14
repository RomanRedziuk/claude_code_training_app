// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}));

const JWT_SECRET = Buffer.from("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  mockCookieGet.mockReset();
});

test("returns null when no cookie is present", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("returns session payload for a valid token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeToken({ userId: "user_1", email: "test@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user_1");
  expect(session?.email).toBe("test@example.com");
});

test("returns null for a malformed token", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieGet.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("returns null for an expired token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeToken({ userId: "user_1", email: "test@example.com" }, "-1s");
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});
