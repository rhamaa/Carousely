"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import JSZip from "jszip";

import { openProjectDialog, saveProject, saveProjectAsDialog } from "@/lib/filesystem";

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
  const [preferMarkdownAspectRatio, setPreferMarkdownAspectRatio] = useState(true);
  const [preferMarkdownTheme, setPreferMarkdownTheme] = useState(true);
  const [fontPreset, setFontPreset] = useState<FontPreset>("modern");
  const [slideOrder, setSlideOrder] = useState<string[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [context, setContext] = useState<DesktopContext | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
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
  const [isDesktopShell, setIsDesktopShell] = useState(false);

  useEffect(() => {
    setIsDesktopShell(
      typeof window !== "undefined" && (
        Boolean((window as any).__TAURI_INTERNALS__) || 
        Boolean((window as any).__TAURI_IPC__)
      )
    );
  }, []);

  const markdownAspectRatio = parsed.metadata.aspectRatio;
  const markdownTheme = parsed.metadata.theme ?? parsed.metadata.brand;

  useEffect(() => {
    setPreferMarkdownAspectRatio(true);
  }, [markdownAspectRatio]);

  useEffect(() => {
    setPreferMarkdownTheme(true);
  }, [markdownTheme]);

  const aspectRatioControlledByMarkdown = Boolean(markdownAspectRatio) && preferMarkdownAspectRatio;
  const themeControlledByMarkdown = Boolean(markdownTheme) && preferMarkdownTheme;
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

    setIsDirty(true);
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

  // Update window title based on project path and dirty state
  useEffect(() => {
    if (!isDesktopShell) return;
    const filename = projectPath ? projectPath.split(/[/\\]/).pop() : "Untitled";
    const title = `${isDirty ? "* " : ""}${filename} - Carousely`;
    getCurrentWindow().setTitle(title).catch(console.error);
  }, [projectPath, isDirty, isDesktopShell]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveProject();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectPath, isDirty, markdown, aspectRatio, selectedTheme, fontPreset, slideOrder]);

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
        dataUrl: stage.toDataURL({ pixelRatio: stageSize.width / 340 }), // Scale from preview width back to full size
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
        const target = await saveProjectAsDialog(json);
        if (!target) return;
        
        setProjectPath(target);
        setIsDirty(false);
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
    downloadBlob(new Blob([json], { type: "application/json" }), "carousely-project.carousely");
    setIsDirty(false);
    setNotice("Project file berhasil diunduh.");
    pushLog("info", "Project diunduh (web mode).");
  };

  const handleSaveProject = async () => {
    if (!isDesktopShell || !projectPath) {
      await handleSaveProjectAs();
      return;
    }
    try {
      const json = JSON.stringify(buildProjectPayload(), null, 2);
      await saveProject(projectPath, json);
      setIsDirty(false);
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
    
    if (isDirty) {
      const confirm = window.confirm("Ada perubahan yang belum disimpan. Yakin ingin membuka project lain?");
      if (!confirm) return;
    }

    try {
      const result = await openProjectDialog();
      if (!result) return;
      
      const payload = JSON.parse(result.content) as SavedProject;
      autosaveReadyRef.current = false; // pause autosave/isDirty trigger
      applyProjectPayload(payload);
      setProjectPath(result.path);
      setIsDirty(false);
      
      // re-enable autosave after state updates
      setTimeout(() => { autosaveReadyRef.current = true; }, 100);
      
      setNotice("Project berhasil dibuka.");
      pushLog("success", `Project dibuka dari ${result.path}`);
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
      
      if (isDesktopShell) {
        const selectedDir = await openDialog({
          title: "Pilih folder tujuan ekspor PNG",
          directory: true,
          multiple: false,
        });

        if (!selectedDir || Array.isArray(selectedDir)) {
          return; // user cancelled
        }

        const exported = await invoke<number>("export_png_folder", {
          folder_path: selectedDir,
          slides: payload,
        });
        
        setNotice(`Ekspor PNG selesai (${exported} file).`);
        pushLog("success", `PNG diekspor ke folder: ${selectedDir}`);
      } else {
        payload.forEach((slide) => {
          const anchor = document.createElement("a");
          anchor.href = slide.dataUrl;
          anchor.download = slide.filename;
          anchor.click();
        });
        setNotice(`Berhasil mengunduh ${payload.length} slide.`);
        pushLog("success", `Ekspor PNG selesai (${payload.length} slide).`);
      }
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
      
      if (isDesktopShell) {
        const uint8array = await zip.generateAsync({ type: "uint8array" });
        
        const { save: saveDialogPlugin } = await import("@tauri-apps/plugin-dialog");
        const selectedFile = await saveDialogPlugin({
          title: "Simpan File ZIP",
          defaultPath: "carousely-slides.zip",
          filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
        });

        if (!selectedFile) {
          return; // user cancelled
        }

        const { writeFile } = await import("@tauri-apps/plugin-fs");
        await writeFile(selectedFile, uint8array);
        
        setNotice("ZIP berhasil disimpan.");
        pushLog("success", `ZIP berisi ${payload.length} slide berhasil disimpan ke: ${selectedFile}`);
      } else {
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, "carousely-slides.zip");
        setNotice("ZIP berhasil dibuat.");
        pushLog("success", `ZIP berisi ${payload.length} slide berhasil diunduh.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat ZIP.";
      setNotice(message);
      pushLog("error", message);
    } finally {
      setIsExportingZip(false);
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
          activeThemeKey={activeThemeKey as import('@/lib/constants').ThemeKey}
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
      setAspectRatio={(value) => {
        setPreferMarkdownAspectRatio(false);
        setAspectRatio(value);
      }}
      aspectRatioControlledByMarkdown={aspectRatioControlledByMarkdown}
      activeThemeKey={activeThemeKey as keyof typeof themeStyles}
      setSelectedTheme={(value) => {
        setPreferMarkdownTheme(false);
        setSelectedTheme(value);
      }}
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
    />
  );
}
