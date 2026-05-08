// Windows Credential Manager keystore, exposed to the frontend as
// Tauri commands. The underlying `keyring` crate picks the native backend
// (Credential Manager on Windows, Keychain on macOS, Secret Service on
// Linux) so the same binary is portable — though this app targets Windows.

use keyring::Entry;
use serde::Serialize;
use thiserror::Error;

const SERVICE: &str = "Remotion Studio Tools Microstock";

#[derive(Debug, Error, Serialize)]
pub enum KeystoreError {
    #[error("invalid alias: must be non-empty ASCII, got empty")]
    InvalidAlias,
    #[error("keyring error: {0}")]
    Keyring(String),
}

impl From<keyring::Error> for KeystoreError {
    fn from(err: keyring::Error) -> Self {
        KeystoreError::Keyring(err.to_string())
    }
}

fn entry(alias: &str) -> Result<Entry, KeystoreError> {
    if alias.trim().is_empty() {
        return Err(KeystoreError::InvalidAlias);
    }
    Ok(Entry::new(SERVICE, alias)?)
}

#[tauri::command]
pub fn keystore_set(alias: String, secret: String) -> Result<(), KeystoreError> {
    entry(&alias)?.set_password(&secret)?;
    Ok(())
}

#[tauri::command]
pub fn keystore_get(alias: String) -> Result<Option<String>, KeystoreError> {
    match entry(&alias)?.get_password() {
        Ok(s) => Ok(Some(s)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(err.into()),
    }
}

#[tauri::command]
pub fn keystore_delete(alias: String) -> Result<(), KeystoreError> {
    match entry(&alias)?.delete_password() {
        Ok(()) => Ok(()),
        // Deleting a missing entry is a no-op from the UI's perspective.
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

#[tauri::command]
pub fn keystore_has(alias: String) -> Result<bool, KeystoreError> {
    match entry(&alias)?.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(err) => Err(err.into()),
    }
}
