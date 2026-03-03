"use client";

import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toPng } from "html-to-image";

type DesktopContext = {
  os: string;
  arch: string;
  profile: string;
};

type SlideBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullet-list"; items: string[] }
  | { kind: "ordered-list"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "image"; alt: string; src: string };

type Slide = {
  id: string;
  title: string;
  blocks: SlideBlock[];
};

type ParseResult = {
  metadata: Record<string, string>;
  slides: Slide[];
};

type EditorStatus = "idle" | "loading" | "error" | "success";
type AspectRatio = "4:5" | "1:1";

const starterMarkdown = `---
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

const themeStyles: Record<string, string> = {
  aurora:
    "bg-gradient-to-br from-cyan-200 via-white to-sky-100 text-slate-900 border border-cyan-300/70",
  ember:
    "bg-gradient-to-br from-amber-100 via-rose-50 to-red-100 text-red-950 border border-red-300/60",
  mono:
    "bg-gradient-to-br from-zinc-100 via-zinc-50 to-slate-200 text-zinc-900 border border-zinc-300",
};

const markdownHint = `Tips format:
- Mulai slide baru dengan "## Judul"
- Bullet list: "- item"
- Numbered list: "1. item"
- Quote block: :::quote ... :::`;

const imageRegex = /^!\[(.*?)]\((.*?)\)\s*$/;
const orderedRegex = /^\d+\.\s+/;

const parseFrontmatter = (source: string): { metadata: Record<string, string>; body: string } => {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { metadata: {}, body: source };
  }

  const metadata: Record<string, string> = {};
  const lines = frontmatterMatch[1].split("\n");

  for (const line of lines) {
    const [rawKey, ...valueParts] = line.split(":");
    if (!rawKey || valueParts.length === 0) {
      continue;
    }

    const key = rawKey.trim();
    const value = valueParts.join(":").trim().replace(/^"|"$/g, "");
    if (key) {
      metadata[key] = value;
    }
  }

  return {
    metadata,
    body: source.slice(frontmatterMatch[0].length),
  };
};

const buildBlocks = (lines: string[]): SlideBlock[] => {
  const blocks: SlideBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line === ":::quote") {
      const quoteLines: string[] = [];
      index += 1;

      while (index < lines.length && lines[index].trim() !== ":::") {
        quoteLines.push(lines[index].trim());
        index += 1;
      }

      if (quoteLines.length > 0) {
        blocks.push({
          kind: "quote",
          text: quoteLines.join(" "),
        });
      }

      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      blocks.push({ kind: "bullet-list", items });
      continue;
    }

    if (orderedRegex.test(line)) {
      const items: string[] = [];

      while (index < lines.length && orderedRegex.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(orderedRegex, "").trim());
        index += 1;
      }

      blocks.push({ kind: "ordered-list", items });
      continue;
    }

    const imageMatch = line.match(imageRegex);
    if (imageMatch) {
      blocks.push({
        kind: "image",
        alt: imageMatch[1] || "image",
        src: imageMatch[2],
      });
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (
        !candidate ||
        candidate === ":::quote" ||
        candidate.startsWith("- ") ||
        orderedRegex.test(candidate) ||
        imageRegex.test(candidate)
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraphLines.join(" ") });
      continue;
    }

    index += 1;
  }

  return blocks;
};

const parseMarkdownToSlides = (source: string): ParseResult => {
  const normalized = source.replace(/\r\n/g, "\n");
  const { metadata, body } = parseFrontmatter(normalized);
  const lines = body.split("\n");
  const slides: Slide[] = [];

  let title = "";
  let buffer: string[] = [];

  const flush = () => {
    const cleaned = buffer.join("\n").trim();
    if (!cleaned && !title) {
      return;
    }

    const blocks = buildBlocks(cleaned ? cleaned.split("\n") : []);
    slides.push({
      id: `slide-${slides.length + 1}`,
      title: title || `Slide ${slides.length + 1}`,
      blocks: blocks.length > 0 ? blocks : [{ kind: "paragraph", text: "(Slide kosong)" }],
    });
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      title = line.slice(3).trim();
      buffer = [];
      continue;
    }

    buffer.push(line);
  }

  flush();

  if (slides.length === 0) {
    slides.push({
      id: "slide-1",
      title: metadata.title || "Slide 1",
      blocks: [{ kind: "paragraph", text: "Mulai dengan heading ## untuk memecah konten." }],
    });
  }

  return { metadata, slides };
};

const renderInline = (text: string): ReactNode[] => {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
};

const makeCaption = (slides: Slide[]): string => {
  return slides
    .map((slide, index) => `${index + 1}. ${slide.title}`)
    .join("\n");
};

export default function Home() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themeStyles>("aurora");
  const [context, setContext] = useState<DesktopContext | null>(null);
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const slideRefs = useRef<Map<string, HTMLElement>>(new Map());

  const parsed = useMemo(() => parseMarkdownToSlides(markdown), [markdown]);
  const caption = useMemo(() => makeCaption(parsed.slides), [parsed.slides]);
  const activeTheme = themeStyles[selectedTheme] ?? themeStyles.aurora;
  const isDesktopShell =
    typeof window !== "undefined" &&
    Boolean((window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__);

  const handleFetchContext = async () => {
    setStatus("loading");
    setError(null);

    try {
      const payload = await invoke<DesktopContext>("desktop_context");
      setContext(payload);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak dapat membaca konteks desktop.");
      setStatus("error");
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setNotice("Caption berhasil dicopy.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Gagal menyalin caption.");
    }
  };

  const handleDownloadProject = () => {
    const payload = JSON.stringify(
      {
        metadata: parsed.metadata,
        aspectRatio,
        theme: selectedTheme,
        markdown,
      },
      null,
      2,
    );

    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "carousely-project.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Project JSON berhasil diunduh.");
  };

  const handleDownloadSlides = useCallback(async () => {
    if (parsed.slides.length === 0 || isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      for (const slide of parsed.slides) {
        const target = slideRefs.current.get(slide.id);
        if (!target) {
          continue;
        }

        const dataUrl = await toPng(target, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });

        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `${slide.id}.png`;
        anchor.click();
      }
      setNotice(`Berhasil mengunduh ${parsed.slides.length} slide.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Gagal merender slide.");
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, parsed.slides]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f2940,_#05070d_56%)] px-4 py-8 text-slate-50 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(16,185,129,0.15)] backdrop-blur">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.36em] text-cyan-300">Carousely Studio</p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                Markdown to Instagram Post Generator
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">{markdownHint}</p>
            </div>

            <div className="grid gap-2 text-xs">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                {isDesktopShell ? "Desktop mode aktif" : "Web preview mode"}
              </div>
              <button
                type="button"
                onClick={handleFetchContext}
                disabled={!isDesktopShell || status === "loading"}
                className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "loading" ? "Membaca context..." : "Refresh desktop context"}
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Aspect ratio
              <select
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
                className="rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-cyan-300 transition focus:ring-2"
              >
                <option value="4:5">Portrait 4:5 (1080x1350)</option>
                <option value="1:1">Square 1:1 (1080x1080)</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Theme
              <select
                value={selectedTheme}
                onChange={(event) => setSelectedTheme(event.target.value as keyof typeof themeStyles)}
                className="rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-cyan-300 transition focus:ring-2"
              >
                {Object.keys(themeStyles).map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            className="h-[460px] w-full resize-y rounded-2xl border border-white/15 bg-black/40 p-4 font-mono text-sm leading-6 text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
            spellCheck={false}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 transition hover:bg-white/15"
            >
              Copy caption summary
            </button>
            <button
              type="button"
              onClick={handleDownloadProject}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-cyan-100 transition hover:bg-cyan-300/20"
            >
              Download project JSON
            </button>
            <button
              type="button"
              onClick={handleDownloadSlides}
              disabled={isDownloading}
              className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloading ? "Rendering slides..." : "Download PNG slides"}
            </button>
            {notice ? <span className="text-emerald-200">{notice}</span> : null}
          </div>

          <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-300 sm:grid-cols-3">
            <p>
              <span className="text-white">Slides:</span> {parsed.slides.length}
            </p>
            <p>
              <span className="text-white">Profile:</span> {context?.profile ?? "-"}
            </p>
            <p>
              <span className="text-white">Desktop:</span>{" "}
              {context ? `${context.os} / ${context.arch}` : status === "error" ? error ?? "error" : "-"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(3,7,18,0.6)] backdrop-blur">
          <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200">Live Preview</p>
              <h2 className="text-xl font-semibold text-white">Carousel Frames</h2>
            </div>
            <p className="text-xs text-slate-300">Mode: {aspectRatio}</p>
          </div>

          <div className="grid max-h-[740px] gap-4 overflow-y-auto pr-1">
            {parsed.slides.map((slide, index) => (
              <article
                key={slide.id}
                ref={(node) => {
                  if (node) {
                    slideRefs.current.set(slide.id, node);
                  } else {
                    slideRefs.current.delete(slide.id);
                  }
                }}
                className={`group relative overflow-hidden rounded-3xl p-4 shadow-md transition hover:shadow-xl ${
                  aspectRatio === "4:5" ? "aspect-[4/5]" : "aspect-square"
                } ${activeTheme}`}
              >
                <div className="absolute right-3 top-3 rounded-full border border-black/10 bg-white/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {index + 1}
                </div>

                <div className="flex h-full flex-col gap-3">
                  <h3 className="text-xl font-semibold leading-tight">{slide.title}</h3>

                  <div className="grid gap-2 text-sm leading-6">
                    {slide.blocks.map((block, blockIndex) => {
                      if (block.kind === "paragraph") {
                        return <p key={`${slide.id}-p-${blockIndex}`}>{renderInline(block.text)}</p>;
                      }

                      if (block.kind === "bullet-list") {
                        return (
                          <ul key={`${slide.id}-ul-${blockIndex}`} className="grid gap-1 pl-5">
                            {block.items.map((item) => (
                              <li key={item} className="list-disc">
                                {renderInline(item)}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      if (block.kind === "ordered-list") {
                        return (
                          <ol key={`${slide.id}-ol-${blockIndex}`} className="grid gap-1 pl-5">
                            {block.items.map((item) => (
                              <li key={item} className="list-decimal">
                                {renderInline(item)}
                              </li>
                            ))}
                          </ol>
                        );
                      }

                      if (block.kind === "quote") {
                        return (
                          <blockquote
                            key={`${slide.id}-q-${blockIndex}`}
                            className="rounded-2xl border border-black/10 bg-white/50 p-3 text-sm italic"
                          >
                            “{block.text}”
                          </blockquote>
                        );
                      }

                      return (
                        <figure
                          key={`${slide.id}-img-${blockIndex}`}
                          className="mt-auto grid gap-1 rounded-2xl border border-dashed border-black/20 bg-black/5 p-3 text-xs"
                        >
                          <span className="font-semibold">Image placeholder</span>
                          <span>{block.alt || "image"}</span>
                          <span className="truncate opacity-80">{block.src}</span>
                        </figure>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
