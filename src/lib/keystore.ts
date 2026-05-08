/**
 * Key storage abstraction.
 *
 * Primary backend: Windows Credential Manager via the Rust `keyring` crate,
 * exposed as Tauri commands `keystore_set` / `keystore_get` /
 * `keystore_delete` / `keystore_has`.
 *
 * Fallback: browser localStorage, used only when the app is loaded in a
 * plain browser (`npm run dev` without Tauri) so the chat UI can still be
 * demoed. Marked with a console warning so developers notice.
 */

import { invoke } from "@tauri-apps/api/core";

const LOCAL_STORAGE_PREFIX = "rstm:secret:";

export type KeystoreBackend = "windows-credential-manager" | "localstorage-fallback";

let cachedBackend: KeystoreBackend | null = null;
let warnedFallback = false;

function isTauri(): boolean {
  // Tauri v2 injects __TAURI_INTERNALS__ on window.
  return (
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in window &&
    !!(window as unknown as { __TAURI_INTERNALS__: unknown })
      .__TAURI_INTERNALS__
  );
}

function warnFallback(err?: unknown) {
  if (warnedFallback) return;
  warnedFallback = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[keystore] Using localStorage fallback. Secrets will NOT be stored " +
      "in Windows Credential Manager. This happens when running outside of " +
      "Tauri (e.g. plain `vite dev`).",
    err,
  );
}

/**
 * Returns which backend is active. Cached after first successful call.
 * Useful for onboarding UI to surface a warning when not running in Tauri.
 */
export async function detectBackend(): Promise<KeystoreBackend> {
  if (cachedBackend) return cachedBackend;
  if (isTauri()) {
    try {
      // Round-trip a harmless no-op to confirm the command is registered.
      await invoke("keystore_has", { alias: "__rstm_ping__" });
      cachedBackend = "windows-credential-manager";
      return cachedBackend;
    } catch (err) {
      warnFallback(err);
    }
  }
  cachedBackend = "localstorage-fallback";
  return cachedBackend;
}

export async function setSecret(alias: string, secret: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("keystore_set", { alias, secret });
      cachedBackend = "windows-credential-manager";
      return;
    } catch (err) {
      warnFallback(err);
    }
  }
  cachedBackend = "localstorage-fallback";
  localStorage.setItem(LOCAL_STORAGE_PREFIX + alias, secret);
}

export async function getSecret(alias: string): Promise<string | null> {
  if (isTauri()) {
    try {
      const value = await invoke<string | null>("keystore_get", { alias });
      cachedBackend = "windows-credential-manager";
      return value ?? null;
    } catch (err) {
      warnFallback(err);
    }
  }
  cachedBackend = "localstorage-fallback";
  return localStorage.getItem(LOCAL_STORAGE_PREFIX + alias);
}

export async function deleteSecret(alias: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("keystore_delete", { alias });
      cachedBackend = "windows-credential-manager";
      return;
    } catch (err) {
      warnFallback(err);
    }
  }
  cachedBackend = "localstorage-fallback";
  localStorage.removeItem(LOCAL_STORAGE_PREFIX + alias);
}

export async function hasSecret(alias: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const present = await invoke<boolean>("keystore_has", { alias });
      cachedBackend = "windows-credential-manager";
      return present;
    } catch (err) {
      warnFallback(err);
    }
  }
  cachedBackend = "localstorage-fallback";
  const v = localStorage.getItem(LOCAL_STORAGE_PREFIX + alias);
  return v !== null && v.length > 0;
}
