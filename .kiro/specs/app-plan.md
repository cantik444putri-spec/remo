# Remotion Studio Tools Microstock — App Plan

> Aplikasi desktop Windows berbasis Tauri untuk membuat konten microstock (video &
> motion graphics) menggunakan Remotion, dengan asisten AI multi-provider
> (OpenAI, Mistral, OpenRouter, Custom) sebagai co-pilot kreatif.

**Nama aplikasi:** Remotion Studio Tools Microstock
**Nama internal / binary:** `remotion-studio-tools-microstock` (display: "Remotion Studio Tools Microstock")
**Target OS:** Windows 10/11 (primary). Build artifact: MSI + NSIS installer.
**Status dokumen:** Locked v1 — 8 May 2026

---

## 1. Tujuan Produk

Menyediakan satu aplikasi desktop terintegrasi yang memungkinkan kreator
microstock untuk:

1. Menghasilkan ide, script, caption, keyword, dan metadata stock lewat asisten
   AI multi-provider.
2. Memvisualkan output AI ke storyboard Remotion yang dapat diedit.
3. Preview langsung (live) via `@remotion/player` dan merender hasil akhir ke
   MP4 4K 30fps siap upload ke platform microstock (Shutterstock, Adobe Stock,
   Pond5, dst).
4. Mengelola API key secara aman (Windows Credential Manager) dan dapat
   berpindah provider tanpa mengubah workflow.

---

## 2. Stack Teknologi (Locked)

| Layer | Pilihan | Alasan |
|---|---|---|
| Desktop shell | **Tauri 2** + Rust | Bundle kecil, WebView2 native, keyring aman |
| Frontend | **React 18 + TypeScript + Vite** | Wajib untuk Remotion |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Modern, konsisten |
| Animasi UI | **Framer Motion** | Transisi halaman & micro-interaction |
| Icons | **Lucide React** | Ringan |
| State | **Zustand** + **TanStack Query** | UI state + server cache/streaming |
| Form | **React Hook Form + Zod** | Validasi API key/base URL |
| DB lokal | **`tauri-plugin-sql` (SQLite)** | History chat, project, render queue |
| Markdown | **react-markdown + rehype-highlight + remark-gfm** | Render jawaban AI |
| Secure store | **`keyring` crate (Rust)** | Windows Credential Manager |
| Video engine | **Remotion 4** (`remotion`, `@remotion/player`, `@remotion/renderer`) | Core produk |
| Window FX | **`tauri-plugin-window-vibrancy`** | Mica/Acrylic blur Windows 11 |
| Notifikasi | **sonner** | Toast modern |
| Shortcut | **`tauri-plugin-global-shortcut`** | Keyboard-first |

---

## 3. AI Provider Abstraction

Semua provider menggunakan format **OpenAI-compatible Chat Completions** dengan
streaming SSE. Hanya berbeda di base URL, API key, dan daftar model.

### Provider Bawaan

| ID | Label | Default Base URL | Default Model |
|---|---|---|---|
| `openai` | OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| `mistral` | Mistral | `https://api.mistral.ai/v1` | **`mistral-large-latest`** (default aktif saat app pertama dibuka) |
| `openrouter` | OpenRouter | `https://openrouter.ai/api/v1` | `openrouter/auto` |
| `custom` | Custom | *(kosong, user isi)* | *(user isi)* |

> **Catatan:** MaiaRouter dihapus dari daftar provider bawaan atas permintaan
> user. Pengguna tetap dapat memakainya lewat slot `custom` dengan memasukkan
> base URL & API key MaiaRouter manual.

### Interface TypeScript

```ts
// src/lib/providers/base.ts
export interface AIProviderConfig {
  id: "openai" | "mistral" | "openrouter" | "custom";
  label: string;
  baseUrl: string;
  apiKeyRef: string;          // alias di Windows Credential Manager, bukan value
  defaultModel: string;
  headers?: Record<string, string>;
}

export interface ChatParams {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream: true;
  signal?: AbortSignal;
}

export interface ChatChunk {
  delta: string;              // token text
  finishReason?: "stop" | "length" | "content_filter" | null;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AIProvider {
  config: AIProviderConfig;
  listModels(): Promise<Array<{ id: string; label?: string }>>;
  chatStream(params: ChatParams): AsyncIterable<ChatChunk>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; message?: string }>;
}
```

Implementasi konkrit: `openai.ts`, `mistral.ts`, `openrouter.ts`, `custom.ts`.
Semua memanggil `POST /chat/completions` dengan `Authorization: Bearer <key>`
dan memparse SSE lewat helper `src/lib/sse.ts`.

### Keamanan

- API key **tidak pernah** disimpan di `localStorage`, `IndexedDB`, atau file
  konfigurasi plaintext.
- Disimpan via Tauri command `keystore_set(alias, secret)` yang memanggil
  `keyring::Entry` (Rust) → Windows Credential Manager.
- Ambil key on-demand dari Rust lewat `keystore_get(alias)`.
- Opsi: request AI dapat di-proxy lewat Rust (`reqwest` + streaming) agar key
  tidak pernah menyentuh JS runtime (aktif secara default).
- CSP ketat di `tauri.conf.json`.

---

## 4. Remotion (Core Video Engine)

### Lisensi

Remotion gratis untuk individu, perusahaan ≤3 orang, dan nonprofit. Aplikasi
akan:

- Menampilkan **onboarding eligibility check** (checkbox "Saya memenuhi syarat
  Free License").
- Jika eligible → spawn renderer dengan `--license-key=free-license`.
- Jika tidak → field di Settings untuk menempel Company License Key.

Disclaimer dan link ke `LICENSE.md` Remotion ditampilkan di halaman Settings.

### Default Render

| Parameter | Nilai |
|---|---|
| Width × Height | **3840 × 2160 (4K UHD)** |
| FPS | **30** |
| Codec | H.264 (opsi: H.265, ProRes, VP9, WebM) |
| CRF | 18 (quality tinggi) |
| Audio sample rate | 48 kHz |
| Hardware accel | Auto-detect NVENC / QSV / AMF |
| Audio | AAC 256kbps stereo |

Preset cepat (tombol di Render panel): 4K30, 4K60, 1080p30, 1080p60,
Square 1:1 1080, Vertical 9:16 2160×3840.

### Fitur Remotion Free License yang diintegrasikan (semua)

- Core: `<Composition>`, `<Sequence>`, `<Series>`, `<Loop>`, `<AbsoluteFill>`,
  `<Freeze>`, `<Still>`.
- Media: `<Audio>`, `<Video>`, `<OffthreadVideo>`, `<Img>`, `<Gif>`, `<IFrame>`.
- Hooks: `useCurrentFrame`, `useVideoConfig`, `useDelayRender`,
  `continueRender`, `delayRender`.
- Math: `interpolate`, `interpolateColors`, `spring`, `Easing`, `random`.
- Audio: `@remotion/media-utils` (waveform, visualisasi, volume envelope).
- Preview: `@remotion/player` (live scrubber, controls, in-app player).
- Render: `@remotion/renderer` (spawn dari Rust via CLI).
- Transitions: `@remotion/transitions` (fade, slide, wipe, clock-wipe, flip,
  iris, none).
- Shapes: `@remotion/shapes` (Rect, Circle, Triangle, Star, Pie).
- Fonts: `@remotion/google-fonts` + `@remotion/fonts`.
- Effects: `@remotion/motion-blur`, `@remotion/noise`, `@remotion/paths`.
- Lottie: `@remotion/lottie`.
- Layout: `@remotion/layout-utils`.
- Dynamic metadata: `calculateMetadata` untuk props fleksibel.
- Assets: `staticFile()` + folder `public/`.

### Struktur Composition

```
src/remotion/
├── Root.tsx                  # daftar semua <Composition />
├── Main.tsx                  # komposisi default 4K30
├── scenes/
│   ├── TitleCard.tsx
│   ├── LowerThird.tsx
│   ├── KenBurns.tsx          # pan-zoom foto microstock
│   ├── TextReveal.tsx
│   ├── LogoReveal.tsx
│   ├── ChartBar.tsx
│   ├── BrollMontage.tsx
│   └── OutroCTA.tsx
├── transitions.ts            # preset transisi antar-scene
└── theme.ts                  # palette, tipografi default
```

### Live Preview

Komponen `<PlayerShell>` membungkus `@remotion/player` dengan:

- Scrubber + play/pause + in/out mark
- Resize-responsive ke ukuran panel
- Sinkron ke Zustand store `studio` (scene list, current frame)
- Inspector kanan edit props live (text, durasi, warna, font)

### Render Pipeline

1. User klik **Render** → pilih preset → konfirmasi.
2. Frontend kirim job ke Tauri command `render_start(projectId, options)`.
3. Rust command:
   - Membuat folder output (default `Documents/Remotion Studio Tools Microstock/Renders/<project>-<timestamp>`)
   - Spawn `npx remotion render src/remotion/index.ts Main <out.mp4>` dengan
     flags sesuai preset, `--license-key`, `--concurrency`, `--scale`, `--crf`,
     codec, dll.
   - Pipe stdout → parse progress → emit event `render://progress` ke frontend.
4. Frontend menampilkan progress bar + ETA di halaman **Renders**.
5. Selesai → toast + tombol "Buka folder".

---

## 5. Microstock Toolkit (Fitur Khusus)

Fitur spesifik untuk kreator microstock, semua ter-integrasi dengan AI:

1. **Idea Generator** — prompt niche → AI keluarkan daftar 20 konsep video
   stock dengan keyword, durasi, style.
2. **Storyboard from prompt** — 1 prompt → JSON storyboard → dimap ke props
   Remotion → langsung terlihat di Player.
3. **Metadata generator** — dari composition props (title, style, scene list)
   → AI keluarkan:
   - Title (≤70 char, SEO microstock)
   - Description (≤200 char)
   - 30–50 keyword (comma-separated, sort by relevance)
   - Category suggestion (sesuai taksonomi Shutterstock/Adobe Stock)
4. **Batch variants** — 1 project → N variasi (ganti warna, text, durasi) untuk
   render ke banyak aspect ratio (16:9, 1:1, 9:16, 4:5) dalam satu batch.
5. **Asset library** — folder `public/` di-scan, AI bisa suggest file yang
   cocok untuk scene tertentu.
6. **Safe-area overlay** — guide overlay untuk TV-safe, Instagram-safe,
   TikTok-safe di preview.
7. **Watermark-free export** — otomatis karena pakai kode sendiri + lisensi
   Remotion free.
8. **Export bundle** — video + file `.csv` metadata + thumbnail PNG, siap drag
   ke portal upload microstock.

---

## 6. Struktur Folder

```
remo/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── keystore.rs          # Windows Credential Manager
│   │   │   ├── ai_proxy.rs          # streaming proxy ke provider
│   │   │   ├── render.rs            # spawn Remotion CLI + progress
│   │   │   └── project.rs           # CRUD project file
│   │   ├── state.rs                 # app state global
│   │   └── error.rs
│   ├── icons/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                              # Frontend React
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── routes/
│   │   │   ├── chat/
│   │   │   ├── studio/               # Video Studio (Remotion)
│   │   │   ├── microstock/           # toolkit khusus
│   │   │   ├── providers/
│   │   │   ├── renders/
│   │   │   └── settings/
│   │   └── layout/
│   │       ├── TitleBar.tsx
│   │       ├── Sidebar.tsx
│   │       └── CommandPalette.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn primitives
│   │   ├── chat/
│   │   ├── studio/
│   │   │   ├── PlayerShell.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── SceneCard.tsx
│   │   │   ├── Inspector.tsx
│   │   │   └── RenderPanel.tsx
│   │   ├── microstock/
│   │   │   ├── IdeaGenerator.tsx
│   │   │   ├── MetadataForm.tsx
│   │   │   └── BatchVariants.tsx
│   │   └── common/
│   ├── lib/
│   │   ├── providers/
│   │   │   ├── base.ts
│   │   │   ├── openai.ts
│   │   │   ├── mistral.ts
│   │   │   ├── openrouter.ts
│   │   │   ├── custom.ts
│   │   │   └── index.ts              # registry
│   │   ├── sse.ts
│   │   ├── keystore.ts               # wrapper ke Tauri command
│   │   ├── db.ts                     # SQLite wrapper
│   │   └── storyboard.ts             # AI JSON → Remotion props
│   ├── remotion/
│   │   ├── index.ts                  # entry Remotion (registerRoot)
│   │   ├── Root.tsx
│   │   ├── Main.tsx
│   │   ├── scenes/
│   │   ├── transitions.ts
│   │   └── theme.ts
│   ├── stores/
│   │   ├── chat.ts
│   │   ├── studio.ts
│   │   ├── settings.ts
│   │   └── renders.ts
│   ├── hooks/
│   └── styles/
│       └── globals.css
├── public/                            # asset Remotion (static)
├── .kiro/
│   └── specs/
│       └── app-plan.md                # dokumen ini
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 7. UI/UX

### Prinsip

- **Dark-first, modern glassmorphism**, OLED true-black opsional.
- **Custom title bar** frameless (drag region, min/max/close custom).
- **Mica/Acrylic** via `tauri-plugin-window-vibrancy` pada Windows 11.
- **Keyboard-first** — semua aksi punya shortcut, command palette Ctrl+K.
- **Responsif di panel**, tidak kaku; panel dapat di-resize & di-collapse.

### Palette Default

- Background: `zinc-950`
- Surface: `zinc-900 / 80%` + backdrop blur
- Accent: linear gradient `violet-500 → fuchsia-500` (user dapat ganti)
- Text: `zinc-100` primer, `zinc-400` sekunder
- Border: `white/5`

### Halaman

| Route | Konten |
|---|---|
| `/chat` | Sidebar history + canvas streaming + panel parameter model (temperature, max tokens, system prompt) |
| `/studio` | 3 panel: scene list & AI prompt kiri, Player tengah, inspector kanan, timeline bawah |
| `/microstock` | Idea Generator, Metadata Form, Batch Variants |
| `/providers` | Card per provider: API key status, base URL, default model, test connection |
| `/renders` | Antrian render, progress, log, buka folder output |
| `/settings` | Theme, HW accel, default preset, Remotion license key, shortcut, tentang |

### Shortcut Default

| Keys | Aksi |
|---|---|
| `Ctrl+K` | Command palette |
| `Ctrl+N` | New chat / new project |
| `Ctrl+,` | Settings |
| `Ctrl+Enter` | Send prompt |
| `Space` | Play/pause Player |
| `Ctrl+R` | Render (di Studio) |
| `Ctrl+B` | Toggle sidebar |

---

## 8. Milestone / Task Breakdown

| # | Milestone | Deliverable | Estimasi Kompleksitas |
|---|---|---|---|
| M1 | Scaffolding Tauri + Vite + Tailwind + shadcn | `npm run tauri dev` berjalan, window kosong dengan title bar custom | Small |
| M2 | Shell UI: title bar, sidebar, routing, theming, command palette | Navigasi antar halaman stub | Small |
| M3 | AI provider abstraction + 4 provider (OpenAI/Mistral/OpenRouter/Custom) + streaming SSE | Chat end-to-end ke minimal 1 provider real | Medium |
| M4 | Secure keystore Rust command + onboarding API key + test connection | API key tersimpan di Credential Manager, bisa switch provider | Medium |
| M5 | Chat page lengkap: history SQLite, markdown render, codeblock, regenerate, edit message | Chat workflow utuh | Medium |
| M6 | Remotion setup: `Root.tsx`, `Main.tsx`, 4K30 default, scene dasar, Player live preview | Video Studio menampilkan preview | Medium |
| M7 | AI → storyboard JSON → Remotion props, inspector live edit | Prompt "Buatkan video 30 detik tentang X" → preview terupdate | Large |
| M8 | Render pipeline: Rust spawn CLI, progress events, Renders page | MP4 4K30 keluar ke folder output | Medium |
| M9 | Microstock toolkit: idea generator, metadata, batch variants, export bundle | Fitur khusus jalan | Medium |
| M10 | Packaging MSI/NSIS, branding (icon, nama), auto-updater, onboarding eligibility Remotion | Installer `.exe` siap distribusi | Small–Medium |
| M11 | Polish: Mica, animasi, shortcut, empty states, error handling, docs in-app | Release candidate v0.1 | Small |

---

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Remotion renderer butuh Node.js di sistem user | Bundle Node runtime via sidecar Tauri, atau deteksi + prompt install |
| API key bocor via DevTools | Disable DevTools di production build, proxy via Rust |
| Render 4K berat → app terasa freeze | Spawn di proses Rust terpisah, progress via event, jangan di main thread |
| User di luar eligibility Free License | Tampilkan disclaimer + field Company License Key di Settings |
| Rate limit provider | TanStack Query + exponential backoff + toast error jelas |
| Model `mistral-large-latest` di-rename/di-deprecate | Auto refresh `listModels()` setiap app start, fallback ke model pertama yang tersedia |

---

## 10. Non-Goals (v0.1)

- macOS & Linux build (fokus Windows dulu).
- Cloud sync antar device.
- Kolaborasi multi-user real-time.
- Marketplace template built-in.
- Upload otomatis ke portal microstock (akan diteliti di v0.2 setelah
  memastikan ToS tiap platform).

---

## 11. Glossary

- **Microstock**: bisnis menjual konten visual (foto/video/ilustrasi) via
  platform seperti Shutterstock, Adobe Stock, Pond5.
- **Storyboard JSON**: struktur data yang menggambarkan urutan scene, durasi,
  teks, dan asset — dihasilkan oleh AI dan dikonsumsi oleh komposisi Remotion.
- **Free License Remotion**: lisensi gratis Remotion untuk individu &
  perusahaan ≤3 orang / nonprofit. Lihat `LICENSE.md` di repo Remotion.
