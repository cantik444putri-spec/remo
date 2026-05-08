/**
 * Key storage abstraction.
 *
 * M3: localStorage-backed fallback so chat works end-to-end during dev.
 * M4: real Windows Credential Manager backing via Tauri commands
 *     `keystore_set` / `keystore_get` / `keystore_delete`.
 *
 * The API below is stable — only the backend swaps in M4.
 */

import { invoke } from "@tauri-apps/api/core";

const LOCAL_STORAGE_PREFIX = "rstm:secret:";

function isTauri(): boolean {
  // Tauri v2 injects __TAURI_INTERNALS__ on window.
  return (
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in window &&
    !!(window as unknown as { __TAURI_INTERNALS__: unknown })
      .__TAURI_INTERNALS__
  );
}

export async function setSecret(alias: string, secret: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("keystore_set", { alias, secret });
      return;
    } catch {
      // Command not wired yet (M4). Fall back to localStorage silently in dev.
    }
  }
  localStorage.setItem(LOCAL_STORAGE_PREFIX + alias, secret);
}

export async function getSecret(alias: string): Promise<string | null> {
  if (isTauri()) {
    try {
      const value = await invoke<string | null>("keystore_get", { alias });
      return value ?? null;
    } catch {
      // Fallback below.
    }
  }
  return localStorage.getItem(LOCAL_STORAGE_PREFIX + alias);
}

export async function deleteSecret(alias: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("keystore_delete", { alias });
      return;
    } catch {
      /* fall through */
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_PREFIX + alias);
}

export async function hasSecret(alias: string): Promise<boolean> {
  const v = await getSecret(alias);
  return v !== null && v.length > 0;
}
