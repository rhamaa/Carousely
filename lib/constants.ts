import type { AspectRatio, FontPreset } from "./types";

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

export const themeStyles = {
  aurora: {
    bgStart: "#baf3ff",
    bgEnd: "#ecfeff",
    text: "#0f172a",
    accent: "#0e7490",
    card: "#f0f9ff",
  },
  ember: {
    bgStart: "#ffd8c2",
    bgEnd: "#fff2e8",
    text: "#3f1d13",
    accent: "#b42318",
    card: "#fff1ea",
  },
  mono: {
    bgStart: "#e4e4e7",
    bgEnd: "#f8fafc",
    text: "#111827",
    accent: "#1f2937",
    card: "#ffffff",
  },
};

export const canvasSize: Record<AspectRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};

export const fontPresets: Record<
  FontPreset,
  { label: string; headingVar: string; bodyVar: string; fallbackHeading: string; fallbackBody: string }
> = {
  geist: {
    label: "Geist Sans",
    headingVar: "--font-geist-sans",
    bodyVar: "--font-geist-sans",
    fallbackHeading: "system-ui",
    fallbackBody: "system-ui",
  },
  modern: {
    label: "Space Grotesk",
    headingVar: "--font-space-grotesk",
    bodyVar: "--font-geist-sans",
    fallbackHeading: "Space Grotesk",
    fallbackBody: "system-ui",
  },
  editorial: {
    label: "Playfair + Geist",
    headingVar: "--font-playfair-display",
    bodyVar: "--font-geist-sans",
    fallbackHeading: "Playfair Display",
    fallbackBody: "system-ui",
  },
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
