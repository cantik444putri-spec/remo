# Remotion Studio Tools Microstock

Aplikasi desktop Windows untuk kreator microstock: asisten AI multi-provider
(OpenAI, Mistral, OpenRouter, custom) + video studio berbasis Remotion dengan
preview live dan render default **4K UHD @ 60fps** (motion-blurred) serta
opsi master **ProRes 4444 .mov dengan alpha** untuk compositing.

> **Status:** Milestone **M6** — Remotion studio + premium animation stack.
> Baca [`.kiro/specs/app-plan.md`](.kiro/specs/app-plan.md) untuk rencana
> penuh.

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

## Bekerja dengan Remotion CLI

```powershell
# Studio (timeline inspector Remotion asli)
npm run remotion:studio

# Render dari CLI (placeholder — akan di-orkestrasi oleh Rust di M8)
npm run remotion:render
```

## Premium animation stack

Paket yang ter-install untuk menghasilkan motion yang halus dan cinematic:

| Kategori | Paket |
|---|---|
| Video engine | `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/renderer` |
| Transitions & motion | `@remotion/transitions`, `@remotion/motion-blur`, `@remotion/animation-utils` |
| Primitives | `@remotion/shapes`, `@remotion/paths`, `@remotion/layout-utils` |
| Media | `@remotion/media-utils`, `@remotion/lottie`, `@remotion/google-fonts`, `@remotion/noise` |
| UI animation | `framer-motion`, `gsap`, `animejs`, `lottie-react` |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` |
| GPU 2D | `pixi.js` |
| Particles | `tsparticles`, `@tsparticles/react`, `@tsparticles/slim`, `simplex-noise` |
| Audio | `howler`, `tone` |
| FFmpeg (M8 pipeline) | `ffmpeg-static`, `fluent-ffmpeg` |
| Utility | `zod`, `axios`, `react-resizable-panels`, `@fontsource/inter` |

> **Catatan:** `electron` / `electron-builder` sengaja tidak diinstal karena
> app ini memakai Tauri 2 (bundle lebih kecil, backend Rust, installer MSI).

## Struktur

```
remo/
├── src/
│   ├── app/                 # layout + routes
│   ├── components/
│   │   ├── studio/          # PlayerShell, Inspector, RenderPanel, SafeAreaOverlay
│   │   ├── chat/            # multi-conversation UI
│   │   └── ui/              # shadcn-style primitives
│   ├── remotion/
│   │   ├── index.ts         # registerRoot
│   │   ├── Root.tsx         # <Composition id="Main" /> 4K 60fps
│   │   ├── Main.tsx         # TransitionSeries + scenes
│   │   ├── scenes/          # TitleCard, LowerThird, OutroCTA, HudOverlay, ParticleField
│   │   ├── animations.ts    # shared springs & eases
│   │   ├── presets.ts       # render preset catalog
│   │   └── theme.ts
│   ├── lib/                 # providers, keystore, sse, chatService
│   ├── stores/              # zustand (chat, providers, studio, settings, ui)
│   └── styles/
├── src-tauri/
│   ├── src/                 # Rust: keystore + tauri commands
│   ├── capabilities/
│   └── tauri.conf.json
├── .kiro/specs/             # design docs
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
| `npm run remotion:studio` | Remotion Studio timeline inspector |
| `npm run remotion:render` | Render Main composition ke `out/Main.mp4` |

## Roadmap Milestone

- **M1** ✅ Scaffold (Tauri 2 + Vite + React + Tailwind v4 + shadcn/ui)
- **M2** ✅ Shell UI, command palette, keyboard shortcuts
- **M3** ✅ AI provider abstraction + SSE streaming
- **M4** ✅ Secure keystore (Windows Credential Manager) + onboarding
- **M5** ✅ Multi-conversation chat + persistence + markdown + parameters
- **M6** ✅ Remotion composition + live preview + premium animation stack
- M7 — AI → storyboard → props live-edit
- M8 — Render pipeline (Rust spawn CLI, progress events)
- M9 — Microstock toolkit (idea generator, metadata, batch variants)
- M10 — Packaging + installer + auto-updater
- M11 — Polish
