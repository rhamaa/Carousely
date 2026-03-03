
# Carousely — Markdown-to-Instagram Concept Notes

## 1. Visi Produk

- **Tujuan**: Memungkinkan kreator membuat carousel/post Instagram native dari satu dokumen markdown, mirip Marp namun dengan fokus feed IG (aspect ratio 1:1 & 4:5).
- **Outcome**: Paket export berisi gambar (PNG/JPEG) tiap slide + caption siap unggah + metadata scheduler.
- **Platform**: Next.js App Router (preview web) + Tauri v2 (desktop) agar bisa akses filesystem lokal & bundling offline.

## 2. Alur Pengguna

1. Pilih preset brand (warna, font, grid).
2. Tulis konten di editor markdown (Monaco/MDX) dan lihat live preview carousel.
3. Insert media lokal melalui dialog Tauri (untuk gambar/ikon).
4. Sesuaikan urutan slide via drag-and-drop.
5. Ekspor: gambar resolusi 1080×1350 atau 1080×1080 + caption `.txt` + optional ZIP.

## 3. Struktur Markdown

```md
---
title: "AI Design Sprint"
brand: "neo-cyan"
aspectRatio: 4:5
palette:
  primary: "#0be9d0"
fonts:
  heading: "Space Grotesk"
---

## Slide 1 — Hook
Kata pembuka **bold**, bullet:
- Insight 1
- Insight 2

:::quote
"CTA atau kutipan penting."
:::

![hero](./assets/hero.png){ratio=cover}

## Slide 2 — Breakdown
1. Step A
2. Step B

:::cta style="primary"
Download checklist → {{brand.primary}}
:::

```

- `##` memecah slide, konten hingga heading berikutnya.
- Blok khusus `:::quote`, `:::agenda`, `:::cta` memberi layout tematik.
- Variabel `{{brand.primary}}`, `{{date}}`, dsb. di-render saat export.

## 4. Arsitektur & Pipeline

| Layer | Detail |
| --- | --- |
| Parser | `unified` + `remark-parse` + `gray-matter` → AST + frontmatter. |
| Slide builder | Map setiap heading menjadi `SlideNode { id, title, blocks[] }`. |
| Layout engine | Template JSON mendefinisikan grid, typography, motion tokens. |
| Preview | React client + `react-konva` stage 1080×1920 (pixel perfect). |
| Export | `Stage.toDataURL()` (MVP) → lanjutkan ke Tauri command + `sharp` untuk batch PNG/ZIP. |
| Caption generator | Gabungkan blok `:::caption` + frontmatter → `.txt` & clipboard. |

## 5. Integrasi Tauri

- Command tambahan: `save_project`, `open_project`, `pick_media`, `export_slides`.
- Aktivasi izin filesystem & dialog pada `tauri.conf.json`.
- Simpan draft `.carousely` (JSON + assets) pada folder lokal user.

## 6. Roadmap Implementasi

1. **MVP web**: Editor markdown + preview HTML, parser heading-to-slide.
2. **Visual fidelity**: Implement Konva renderer + theme system.
3. **Export**: HTML-to-image → migrasi ke Konva/Sharp untuk kualitas tinggi.
4. **Desktop UX**: Autosave, recent files, dialog media via Tauri.
5. **Ekstra**: Template marketplace, plugin block (kode, chart, dsb.).

## 7. Catatan Risiko

- Dependensi bleeding-edge (Next 16, React 19, Tailwind 4) → perlu lock vers.
- Tailwind 4 alpha: pastikan pipeline PostCSS sesuai atau fallback ke 3.x.
- Perlu strategi caching assets besar saat render (sharing via Tauri FS API).
- Eksport kualitas tinggi memerlukan pipeline GPU/Sharp agar tidak lambat.

