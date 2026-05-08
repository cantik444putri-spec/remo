import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Entry point consumed by the Remotion CLI via `remotion render
// src/remotion/index.ts <composition> <out>`. Never imported from the
// React shell directly — the Studio uses <Player /> with the root
// component, not this file.
registerRoot(RemotionRoot);
