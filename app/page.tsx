"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import JSZip from "jszip";

import type {
  AspectRatio,
  DesktopContext,
  ExportSlidePayload,
  FontPreset,
  KonvaRuntime,
  LogEntry,
  LogLevel,
  SavedProject,
  StageHandle,
  Slide,
} from "@/lib/types";
import { autosaveStorageKey, canvasSize, fontPresets, starterMarkdown, themeStyles } from "@/lib/constants";
import { dataUrlToUint8Array, fileToDataUrl, resolveFontFamily } from "@/lib/utils";
import { parseMarkdownToSlides } from "@/lib/parser";

import MainLayout from "@/components/layout/MainLayout";
import SlideSidebar from "@/components/sidebar/SlideSidebar";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import SlidePreview from "@/components/preview/SlidePreview";
import LogPanel from "@/components/layout/LogPanel";

const makeCaption = (slides: Slide[]): string => {
  return slides.map((slide, index) => `${index + 1}. ${slide.title}`).join("\n");
};

export default function Home() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themeStyles>("aurora");
  const [fontPreset, setFontPreset] = useState<FontPreset>("geist");
  const [slideOrder, setSlideOrder] = useState<string[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [context, setContext] = useState<DesktopContext | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingFolder, setIsExportingFolder] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [konvaRuntime, setKonvaRuntime] = useState<KonvaRuntime | null>(null);
  
  const stageRefs = useRef<Map<string, StageHandle>>(new Map());
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autosaveReadyRef = useRef(false);

  const parsed = useMemo(() => parseMarkdownToSlides(markdown), [markdown]);
  const orderedSlides = useMemo(() => {
    const byId = new Map(parsed.slides.map((slide) => [slide.id, slide]));
    const resolved: Slide[] = [];
    for (const id of slideOrder) {
      const slide = byId.get(id);
      if (slide) {
        resolved.push(slide);
        byId.delete(id);
      }
    }

    for (const slide of parsed.slides) {
      if (byId.has(slide.id)) {
        resolved.push(slide);
      }
    }

    return resolved;
  }, [parsed.slides, slideOrder]);
  
  const lintSlideErrors = useMemo(
    () => orderedSlides.reduce((count, slide) => count + slide.errors.length, 0),
    [orderedSlides],
  );
  const lintWarningCount = parsed.warnings.length;
  const lintIssueCount = lintSlideErrors + lintWarningCount;
  
  const manualAspectRatio = aspectRatio;
  const manualTheme = selectedTheme;
  const isDesktopShell = typeof window !== "undefined" && Boolean((window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__);
  const aspectRatioControlledByMarkdown = Boolean(parsed.metadata.aspectRatio);
  const themeControlledByMarkdown = Boolean(parsed.metadata.theme ?? parsed.metadata.brand);
  const activeAspectRatio = aspectRatioControlledByMarkdown ? parsed.resolved.aspectRatio : manualAspectRatio;
  const activeThemeKey = (themeControlledByMarkdown ? parsed.resolved.theme : manualTheme) as keyof typeof themeStyles;
  const activeTheme = themeStyles[activeThemeKey] ?? themeStyles.aurora;
  const activeFont = fontPresets[fontPreset];
  const headingFontFamily = resolveFontFamily(activeFont.headingVar, activeFont.fallbackHeading);
  const bodyFontFamily = resolveFontFamily(activeFont.bodyVar, activeFont.fallbackBody);
  const stageSize = canvasSize[activeAspectRatio];

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      import("react-konva/lib/ReactKonvaCore"),
      import("konva/lib/shapes/Rect"),
      import("konva/lib/shapes/Line"),
      import("konva/lib/shapes/Text"),
    ])
      .then(([module]) => {
        if (cancelled) return;
        setKonvaRuntime({
          Stage: module.Stage as KonvaRuntime["Stage"],
          Layer: module.Layer as KonvaRuntime["Layer"],
          Group: module.Group as KonvaRuntime["Group"],
          Rect: module.Rect as KonvaRuntime["Rect"],
          Line: module.Line as KonvaRuntime["Line"],
          Text: module.Text as KonvaRuntime["Text"],
        });
      })
      .catch(() => {
        if (!cancelled) setNotice("Konva gagal dimuat pada runtime.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pushLog = useCallback((level: LogLevel, message: string) => {
    const entry: LogEntry = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setLogs((previous) => [...previous.slice(-79), entry]);
  }, []);

  useEffect(() => {
    setSlideOrder((previous) => {
      const availableIds = parsed.slides.map((slide) => slide.id);
      if (availableIds.length === 0) return [];
      const retained = previous.filter((id) => availableIds.includes(id));
      const missing = availableIds.filter((id) => !retained.includes(id));
      const next = [...retained, ...missing];
      const unchanged = next.length === previous.length && next.every((id, index) => id === previous[index]);
      return unchanged ? previous : next;
    });
  }, [parsed.slides]);

  useEffect(() => {
    if (orderedSlides.length === 0) {
      if (activeSlideId !== null) setActiveSlideId(null);
      return;
    }
    if (!activeSlideId || !orderedSlides.some((slide) => slide.id === activeSlideId)) {
      setActiveSlideId(orderedSlides[0].id);
    }
  }, [orderedSlides, activeSlideId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(autosaveStorageKey);
      if (raw) {
        const saved = JSON.parse(raw) as SavedProject;
        if (typeof saved.markdown === "string") setMarkdown(saved.markdown);
        if (saved.aspectRatio === "4:5" || saved.aspectRatio === "1:1") setAspectRatio(saved.aspectRatio);
        if (saved.theme && saved.theme in themeStyles) setSelectedTheme(saved.theme as keyof typeof themeStyles);
        if (saved.fontPreset && saved.fontPreset in fontPresets) setFontPreset(saved.fontPreset);
        if (Array.isArray(saved.slideOrder)) setSlideOrder(saved.slideOrder);

        setNotice("Autosave dimuat.");
        pushLog("info", "Autosave project dipulihkan dari local storage.");
      }
    } catch {
      window.localStorage.removeItem(autosaveStorageKey);
      pushLog("error", "Autosave rusak dan telah direset.");
    } finally {
      autosaveReadyRef.current = true;
    }
  }, [pushLog]);

  useEffect(() => {
    if (!autosaveReadyRef.current || typeof window === "undefined") return;

    const payload: SavedProject = {
      version: 1,
      markdown,
      aspectRatio,
      theme: selectedTheme,
      fontPreset,
      slideOrder,
    };
    window.localStorage.setItem(autosaveStorageKey, JSON.stringify(payload));
  }, [markdown, aspectRatio, selectedTheme, fontPreset, slideOrder]);

  const collectExportSlides = useCallback((): ExportSlidePayload[] => {
    if (!konvaRuntime) throw new Error("Konva belum siap. Tunggu preview termuat.");

    const payload: ExportSlidePayload[] = [];
    orderedSlides.forEach((slide, index) => {
      const stage = stageRefs.current.get(slide.id);
      if (!stage) return;

      const sanitizedTitle = slide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      const filename = `${String(index + 1).padStart(2, "0")}-${sanitizedTitle || slide.id}.png`;

      payload.push({
        filename,
        dataUrl: stage.toDataURL({ pixelRatio: 2 }),
      });
    });

    if (payload.length === 0) throw new Error("Belum ada slide yang siap diekspor.");
    return payload;
  }, [konvaRuntime, orderedSlides]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildProjectPayload = (): SavedProject => {
    return {
      version: 1,
      markdown,
      aspectRatio,
      theme: selectedTheme,
      fontPreset,
      slideOrder,
    };
  };

  const applyProjectPayload = (payload: SavedProject) => {
    if (typeof payload.markdown !== "string") throw new Error("Format project tidak valid.");
    setMarkdown(payload.markdown);
    if (payload.aspectRatio === "4:5" || payload.aspectRatio === "1:1") setAspectRatio(payload.aspectRatio);
    if (payload.theme && payload.theme in themeStyles) setSelectedTheme(payload.theme as keyof typeof themeStyles);
    if (payload.fontPreset && payload.fontPreset in fontPresets) setFontPreset(payload.fontPreset);
    if (Array.isArray(payload.slideOrder)) setSlideOrder(payload.slideOrder);
  };

  const handleFetchContext = async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = await invoke<DesktopContext>("desktop_context");
      setContext(payload);
      setStatus("success");
      pushLog("success", `Desktop context diperbarui (${payload.os}/${payload.arch}).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tidak dapat membaca konteks desktop.";
      setError(message);
      setStatus("error");
      pushLog("error", message);
    }
  };

  const handleSaveProjectAs = async () => {
    const json = JSON.stringify(buildProjectPayload(), null, 2);
    if (isDesktopShell) {
      try {
        const target = await saveDialog({
          title: "Simpan project Carousely",
          defaultPath: projectPath ?? "project.carousely.json",
          filters: [{ name: "Carousely Project", extensions: ["json"] }],
        });
        if (!target || Array.isArray(target)) return;
        await invoke("save_project_file", { path: target, content: json });
        setProjectPath(target);
        setNotice("Project berhasil disimpan.");
        pushLog("success", `Project disimpan ke ${target}`);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal menyimpan project.";
        setNotice(message);
        pushLog("error", message);
        return;
      }
    }
    downloadBlob(new Blob([json], { type: "application/json" }), "carousely-project.json");
    setNotice("Project JSON berhasil diunduh.");
    pushLog("info", "Project diunduh sebagai JSON (web mode).");
  };

  const handleSaveProject = async () => {
    if (!isDesktopShell || !projectPath) {
      await handleSaveProjectAs();
      return;
    }
    try {
      const json = JSON.stringify(buildProjectPayload(), null, 2);
      await invoke("save_project_file", { path: projectPath, content: json });
      setNotice("Project diperbarui.");
      pushLog("success", `Project diperbarui di ${projectPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan project.";
      setNotice(message);
      pushLog("error", message);
    }
  };

  const handleOpenProject = async () => {
    if (!isDesktopShell) {
      setNotice("Open project native hanya tersedia di mode desktop.");
      return;
    }
    try {
      const selected = await openDialog({
        title: "Buka project Carousely",
        multiple: false,
        filters: [{ name: "Carousely Project", extensions: ["json"] }],
      });
      if (!selected || Array.isArray(selected)) return;
      const content = await invoke<string>("open_project_file", { path: selected });
      const payload = JSON.parse(content) as SavedProject;
      applyProjectPayload(payload);
      setProjectPath(selected);
      setNotice("Project berhasil dibuka.");
      pushLog("success", `Project dibuka dari ${selected}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuka project.";
      setNotice(message);
      pushLog("error", message);
    }
  };

  const handleExportPng = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    try {
      const payload = collectExportSlides();
      payload.forEach((slide) => {
        const anchor = document.createElement("a");
        anchor.href = slide.dataUrl;
        anchor.download = slide.filename;
        anchor.click();
      });
      setNotice(`Berhasil mengunduh ${payload.length} slide.`);
      pushLog("success", `Ekspor PNG selesai (${payload.length} slide).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengekspor PNG.";
      setNotice(message);
      pushLog("error", message);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportZip = async () => {
    if (isExportingZip) return;
    setIsExportingZip(true);
    try {
      const payload = collectExportSlides();
      const zip = new JSZip();
      payload.forEach((slide) => {
        zip.file(slide.filename, dataUrlToUint8Array(slide.dataUrl));
      });
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, "carousely-slides.zip");
      setNotice("ZIP berhasil dibuat.");
      pushLog("success", `ZIP berisi ${payload.length} slide berhasil diunduh.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat ZIP.";
      setNotice(message);
      pushLog("error", message);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportToFolder = async () => {
    if (!isDesktopShell) {
      setNotice("Ekspor ke folder native hanya tersedia di mode desktop.");
      return;
    }
    if (isExportingFolder) return;
    setIsExportingFolder(true);
    try {
      const selected = await openDialog({
        title: "Pilih folder tujuan ekspor",
        directory: true,
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      const payload = collectExportSlides();
      const exported = await invoke<number>("export_png_folder", {
        folderPath: selected,
        slides: payload,
      });
      setNotice(`Ekspor folder selesai (${exported} file).`);
      pushLog("success", `PNG diekspor ke folder ${selected}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal ekspor ke folder.";
      setNotice(message);
      pushLog("error", message);
    } finally {
      setIsExportingFolder(false);
    }
  };

  const handleEditorDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      const alt = file.name.replace(/\.[^.]+$/, "");
      const snippet = `![${alt}](${dataUrl}){ratio=cover align=center}\n`;
      
      const textarea = editorTextareaRef.current;
      if (!textarea) {
        setMarkdown((previous) => `${previous}\n${snippet}`);
        return;
      }

      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;

      setMarkdown((previous) => {
        return `${previous.slice(0, selectionStart)}${snippet}${previous.slice(selectionEnd)}`;
      });

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = selectionStart + snippet.length;
        textarea.selectionStart = cursor;
        textarea.selectionEnd = cursor;
      });

      setNotice(`Gambar ${file.name} dimasukkan ke markdown.`);
      pushLog("success", `Media lokal ditambahkan via drag-and-drop: ${file.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses gambar drop.";
      setNotice(message);
      pushLog("error", message);
    }
  };

  const handleSelectSlide = (slideId: string) => {
    setActiveSlideId(slideId);
    const element = document.getElementById(`preview-${slideId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDropSlideOn = (targetSlideId: string) => {
    if (!draggingSlideId || draggingSlideId === targetSlideId) return;

    setSlideOrder((previous) => {
      const next = [...previous];
      const from = next.indexOf(draggingSlideId);
      const to = next.indexOf(targetSlideId);
      if (from < 0 || to < 0) return previous;

      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

    pushLog("info", `Urutan slide diperbarui (${draggingSlideId} -> ${targetSlideId}).`);
  };

  return (
    <MainLayout
      sidebar={
        <SlideSidebar
          slides={orderedSlides}
          activeSlideId={activeSlideId}
          draggingSlideId={draggingSlideId}
          onDragStart={setDraggingSlideId}
          onDragEnd={() => setDraggingSlideId(null)}
          onDrop={handleDropSlideOn}
          onSelectSlide={handleSelectSlide}
        />
      }
      editor={
        <MarkdownEditor
          markdown={markdown}
          setMarkdown={setMarkdown}
          editorTextareaRef={editorTextareaRef}
          onDrop={handleEditorDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => e.preventDefault()}
          lintIssueCount={lintIssueCount}
          lintSlideErrors={lintSlideErrors}
          lintWarningCount={lintWarningCount}
        />
      }
      preview={
        <SlidePreview
          orderedSlides={orderedSlides}
          activeSlideId={activeSlideId}
          setActiveSlideId={handleSelectSlide}
          stageSize={stageSize}
          activeAspectRatio={activeAspectRatio}
          activeFont={activeFont}
          headingFontFamily={headingFontFamily}
          bodyFontFamily={bodyFontFamily}
          activeTheme={activeTheme}
          showGuides={showGuides}
          showSafeArea={showSafeArea}
          konvaRuntime={konvaRuntime}
          stageRefs={stageRefs}
        />
      }
      logPanel={
        <LogPanel
          logs={logs}
          onClear={() => {
            setLogs([]);
            pushLog("info", "Log terminal dibersihkan.");
          }}
        />
      }
      // Topbar props
      activeAspectRatio={activeAspectRatio as AspectRatio}
      setAspectRatio={setAspectRatio}
      aspectRatioControlledByMarkdown={aspectRatioControlledByMarkdown}
      activeThemeKey={activeThemeKey as keyof typeof themeStyles}
      setSelectedTheme={setSelectedTheme}
      themeControlledByMarkdown={themeControlledByMarkdown}
      fontPreset={fontPreset}
      setFontPreset={setFontPreset}
      showGuides={showGuides}
      setShowGuides={setShowGuides}
      showSafeArea={showSafeArea}
      setShowSafeArea={setShowSafeArea}
      isDesktopShell={isDesktopShell}
      onOpenProject={handleOpenProject}
      onSaveProject={() => void handleSaveProject()}
      onSaveProjectAs={() => void handleSaveProjectAs()}
      onExportPng={() => void handleExportPng()}
      isExportingPng={isExportingPng}
      onExportZip={() => void handleExportZip()}
      isExportingZip={isExportingZip}
      onExportFolder={() => void handleExportToFolder()}
      isExportingFolder={isExportingFolder}
    />
  );
}
