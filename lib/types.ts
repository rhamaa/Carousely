import type { ComponentType } from "react";

export type StageHandle = {
  toDataURL: (config?: { pixelRatio?: number }) => string;
};

export type KonvaRuntime = {
  Stage: ComponentType<Record<string, unknown>>;
  Layer: ComponentType<Record<string, unknown>>;
  Group: ComponentType<Record<string, unknown>>;
  Rect: ComponentType<Record<string, unknown>>;
  Line: ComponentType<Record<string, unknown>>;
  Text: ComponentType<Record<string, unknown>>;
};

export type DesktopContext = {
  os: string;
  arch: string;
  profile: string;
};

export type AspectRatio = "4:5" | "1:1";
export type FontPreset = "geist" | "modern" | "editorial";

export type SavedProject = {
  version: number;
  markdown: string;
  aspectRatio: AspectRatio;
  theme: string;
  fontPreset: FontPreset;
  slideOrder?: string[];
};

export type ExportSlidePayload = {
  filename: string;
  dataUrl: string;
};

export type LogLevel = "info" | "success" | "error";

export type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
};

export type CTAStyle = "primary" | "secondary";

export type SlideBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullet-list"; items: string[] }
  | { kind: "ordered-list"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "image"; alt: string; src: string; ratio?: string; align?: string }
  | { kind: "cta"; text: string; style: CTAStyle; href?: string }
  | { kind: "agenda"; title?: string; items: string[]; columns?: number };

export type Slide = {
  id: string;
  title: string;
  blocks: SlideBlock[];
  errors: string[];
};

export type ParseResult = {
  metadata: Record<string, string>;
  slides: Slide[];
  warnings: string[];
  resolved: {
    aspectRatio: AspectRatio;
    theme: string;
  };
};

export type EditorStatus = "idle" | "loading" | "error" | "success";
