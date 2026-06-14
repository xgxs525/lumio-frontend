export const AUTH_TOKEN_KEY = "lumio_access_token";
export const AUTH_EXPIRES_KEY = "lumio_token_expires_at";
export const AUTH_USER_KEY = "lumio_user";
export const AUTH_WORKSPACE_KEY = "lumio_workspace";
export const AUTH_CHANGED_EVENT = "lumio-auth-changed";

export type StoredAuth = {
  token: string;
  expiresAt: string;
  user: Record<string, unknown>;
  workspace: Record<string, unknown>;
};

function parseJsonRecord(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY);
  if (!token || !expiresAt) return null;

  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isFinite(expiresTime) && expiresTime <= Date.now()) {
    clearStoredAuth();
    return null;
  }

  return {
    token,
    expiresAt,
    user: parseJsonRecord(localStorage.getItem(AUTH_USER_KEY)),
    workspace: parseJsonRecord(localStorage.getItem(AUTH_WORKSPACE_KEY)),
  };
}

export function saveStoredAuth(data: {
  accessToken: string;
  expiresAt: string;
  user: Record<string, unknown>;
  workspace: Record<string, unknown>;
}) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  localStorage.setItem(AUTH_EXPIRES_KEY, data.expiresAt);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(AUTH_WORKSPACE_KEY, JSON.stringify(data.workspace));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function updateStoredIdentity(data: {
  user: Record<string, unknown>;
  workspace: Record<string, unknown>;
}) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(AUTH_WORKSPACE_KEY, JSON.stringify(data.workspace));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_WORKSPACE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getDisplayName(user: Record<string, unknown> | undefined) {
  if (!user) return "用户";
  const name = user.name || user.email || user.phone;
  return typeof name === "string" && name.trim() ? name : "用户";
}

export function getAvatarInitial(user: Record<string, unknown> | undefined) {
  const displayName = getDisplayName(user);
  return displayName.slice(0, 1).toUpperCase();
}
