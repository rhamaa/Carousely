import type { AspectRatio } from "./types";

export const starterMarkdown = `---
title: "Konten Creator Sprint"
brand: "aurora"
aspectRatio: 4:5
---

## Slide 1 - Hook
3 kesalahan paling umum saat bikin konten carousel:
- Judul kurang tajam
- Visual tidak konsisten
- CTA terlalu umum

:::quote
Konten bagus = ide kuat + struktur jelas + eksekusi visual konsisten.
:::

## Slide 2 - Framework
1. Buka dengan pain point yang spesifik.
2. Breakdown jadi 3-5 poin actionable.
3. Tutup dengan CTA yang mengundang aksi.

## Slide 3 - CTA
Pakai Carousely untuk menulis satu markdown dan generate semua slide otomatis.
![preview](./assets/example-cover.png)
`;

export interface ThemeTokens {
  bgStart: string;
  bgEnd: string;
  text: string;
  accent: string;
  card: string;
  shapeBorderWidth: number;
  shapeBorderColor: string;
  shapeShadowX: number;
  shapeShadowY: number;
  shapeShadowBlur: number;
  shapeShadowColor: string;
  shapeRadius: number;
  fontHeading?: string;
  fontBody?: string;
}

export type ThemeKey = "aurora" | "ember" | "mono" | "soft-brutalism" | "neumorphism" | "midnight" | "sunset";

export const themeStyles: Record<ThemeKey, ThemeTokens> = {
  aurora: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 0,
    shapeBorderColor: "transparent",
    shapeShadowX: 0,
    shapeShadowY: 4,
    shapeShadowBlur: 12,
    shapeShadowColor: "rgba(0, 0, 0, 0.1)",
    shapeRadius: 24,
  },
  ember: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 2,
    shapeBorderColor: "#ffd8c2",
    shapeShadowX: 0,
    shapeShadowY: 8,
    shapeShadowBlur: 16,
    shapeShadowColor: "rgba(180, 35, 24, 0.15)",
    shapeRadius: 16,
  },
  mono: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 1,
    shapeBorderColor: "#d1d5db",
    shapeShadowX: 0,
    shapeShadowY: 2,
    shapeShadowBlur: 4,
    shapeShadowColor: "rgba(0, 0, 0, 0.05)",
    shapeRadius: 8,
  },
  "soft-brutalism": {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 4,
    shapeBorderColor: "#000000",
    shapeShadowX: 12,
    shapeShadowY: 12,
    shapeShadowBlur: 0,
    shapeShadowColor: "#000000",
    shapeRadius: 0,
  },
  neumorphism: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 0,
    shapeBorderColor: "transparent",
    shapeShadowX: 10,
    shapeShadowY: 10,
    shapeShadowBlur: 20,
    shapeShadowColor: "rgba(163, 177, 198, 0.7)",
    shapeRadius: 30,
  },
  midnight: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 1,
    shapeBorderColor: "#334155",
    shapeShadowX: 0,
    shapeShadowY: 8,
    shapeShadowBlur: 24,
    shapeShadowColor: "rgba(0, 0, 0, 0.4)",
    shapeRadius: 16,
  },
  sunset: {
    bgStart: "var(--slide-bg-start)",
    bgEnd: "var(--slide-bg-end)",
    text: "var(--slide-text)",
    accent: "var(--slide-accent)",
    card: "var(--slide-card-bg)",
    shapeBorderWidth: 0,
    shapeBorderColor: "transparent",
    shapeShadowX: 0,
    shapeShadowY: 10,
    shapeShadowBlur: 30,
    shapeShadowColor: "rgba(0, 0, 0, 0.3)",
    shapeRadius: 32,
  }
};

export const canvasSize: Record<AspectRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};

export const markdownHint = `Tips format:
- Mulai slide baru dengan "## Judul"
- Bullet list: "- item"
- Numbered list: "1. item"
- Quote block: :::quote ... :::
- CTA block: :::cta style="primary" href="https://..." ... :::
- Agenda block: :::agenda title="Roadmap" columns="2" ... :::
- Image attrs: ![alt](img.png){ratio=cover align=center}`;

export const autosaveStorageKey = "carousely.autosave.v1";

export const quickSnippets: Array<{ label: string; content: string }> = [
  {
    label: "Quote",
    content: ":::quote\nTuliskan insight utama kamu di sini.\n:::\n",
  },
  {
    label: "CTA",
    content: ":::cta style=\"primary\" href=\"https://\"\nAjak audiens ambil tindakan.\n:::\n",
  },
  {
    label: "Agenda",
    content: ":::agenda title=\"Roadmap\" columns=\"2\"\n- Poin 1\n- Poin 2\n- Poin 3\n- Poin 4\n:::\n",
  },
  {
    label: "Image",
    content: "![cover](./assets/cover.png){ratio=cover align=center}\n",
  },
];
