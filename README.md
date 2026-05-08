# Remotion Studio Tools Microstock

Aplikasi desktop Windows untuk kreator microstock: asisten AI multi-provider
(OpenAI, Mistral, OpenRouter, custom) + video studio berbasis Remotion dengan
preview live dan render default 4K UHD @ 30fps.

> **Status:** Milestone **M1** — scaffolding selesai. Baca
> [`.kiro/specs/app-plan.md`](.kiro/specs/app-plan.md) untuk rencana penuh.

---

## Prasyarat Development

| Tool | Versi minimum |
|---|---|
| Node.js | 20 LTS (direkomendasikan 22) |
| Rust | 1.77+ (stable) via [rustup](https://rustup.rs) |
| Windows 10/11 | WebView2 Runtime (sudah default di Win 11) |
| Microsoft Visual Studio Build Tools | "Desktop development with C++" |

Ikuti panduan prasyarat resmi Tauri:
<https://v2.tauri.app/start/prerequisites/>.

## Menjalankan di lokal (Windows)

```powershell
# 1. clone & masuk
git clone https://github.com/cantik444putri-spec/remo.git
cd remo

# 2. install dependency frontend
npm install

# 3. mode dev (Vite + jendela Tauri)
npm run tauri:dev

# 4. build installer MSI + NSIS
npm run tauri:build
```

Instalasi pertama kali Tauri akan mengunduh crate & toolchain (bisa beberapa
menit). Hasil `tauri:build` muncul di `src-tauri/target/release/bundle/`.

## Struktur

```
remo/
├── src/                  # React frontend (Vite)
│   ├── app/              # layout + routes
│   ├── components/ui/    # shadcn primitives
│   ├── lib/              # util, providers (nanti)
│   └── styles/
├── src-tauri/            # Rust backend (Tauri 2)
│   ├── src/
│   ├── capabilities/
│   └── tauri.conf.json
├── .kiro/specs/          # design docs
└── package.json
```

## Scripts

| Script | Deskripsi |
|---|---|
| `npm run dev` | Jalankan Vite dev server (tanpa jendela Tauri) |
| `npm run tauri:dev` | Jalankan app desktop (Vite + WebView2) |
| `npm run build` | Type-check + build frontend ke `dist/` |
| `npm run tauri:build` | Build installer Windows |
| `npm run typecheck` | `tsc --noEmit` |

## Roadmap Milestone

Lihat [`.kiro/specs/app-plan.md`](.kiro/specs/app-plan.md) untuk detail. Ringkasan:

- **M1 — Scaffold** ✅ (Tauri 2 + Vite + React + Tailwind v4 + shadcn/ui)
- M2 — Shell UI & command palette
- M3 — AI provider abstraction + streaming
- M4 — Secure keystore (Windows Credential Manager)
- M5 — Chat lengkap + SQLite history
- M6 — Remotion composition + live preview
- M7 — AI → storyboard → props live-edit
- M8 — Render pipeline 4K30
- M9 — Microstock toolkit
- M10 — Packaging + onboarding
- M11 — Polish
