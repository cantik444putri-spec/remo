# Icons

Tauri requires baseline icon files here before `npm run tauri:build` can
produce installers. Expected files:

- `icon.png` (1024×1024)
- `icon.ico` (multi-size Windows icon)

## Quick generate from a single source PNG

After placing a source `icon-source.png` (≥1024×1024) in this folder, run:

```bash
npx @tauri-apps/cli icon icons/icon-source.png
```

This regenerates all platform variants automatically. Reference:
<https://v2.tauri.app/develop/icons/>.

Placeholder icons are intentionally **not** committed to the repo. Add your
own before producing a release build.
