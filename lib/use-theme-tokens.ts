"use client";

import { useEffect, useState, useRef } from "react";
import type { ThemeTokens, ThemeKey } from "./constants";
import { themeStyles } from "./constants";

/**
 * Hook to extract CSS variables from the DOM and convert them into JS values
 * for Konva to use. Konva requires raw values (hex/rgb/numbers), not 'var(--name)'.
 */
export function useThemeTokens(themeKey: ThemeKey): ThemeTokens {
  const [tokens, setTokens] = useState<ThemeTokens>(() => extractTokens(themeKey));
  
  // We use a hidden ref element attached to body to read computed styles
  const testerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!testerRef.current) {
      testerRef.current = document.createElement("div");
      testerRef.current.style.display = "none";
      document.body.appendChild(testerRef.current);
    }

    testerRef.current.setAttribute("data-theme", themeKey);

    // Read styles after a short delay to ensure DOM update
    const timer = setTimeout(() => {
      if (testerRef.current) {
        setTokens(extractTokens(themeKey, testerRef.current));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [themeKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testerRef.current && testerRef.current.parentNode) {
        testerRef.current.parentNode.removeChild(testerRef.current);
      }
    };
  }, []);

  return tokens;
}

function extractTokens(themeKey: string, element?: HTMLElement): ThemeTokens {
  // If it's a known theme from themeStyles, use those defaults, otherwise use empty/basic defaults
  const isCustomTheme = !(themeKey in themeStyles);
  const defaults = isCustomTheme 
    ? {
        bgStart: "var(--slide-bg-start)",
        bgEnd: "var(--slide-bg-end)",
        text: "var(--slide-text)",
        accent: "var(--slide-accent)",
        card: "var(--slide-card-bg)",
        shapeBorderWidth: 0,
        shapeBorderColor: "transparent",
        shapeShadowX: 0,
        shapeShadowY: 0,
        shapeShadowBlur: 0,
        shapeShadowColor: "transparent",
        shapeRadius: 0,
        fontHeading: "var(--slide-font-heading)",
        fontBody: "var(--slide-font-body)",
        bgPattern: "var(--slide-bg-pattern)",
      }
    : themeStyles[themeKey as ThemeKey];
  
  if (!element || typeof window === "undefined") {
    // Return fallback values for SSR or initial render
    return getFallbackTokens(themeKey);
  }

  const computed = window.getComputedStyle(element);
  
  const resolveVar = (val: string | number) => {
    if (typeof val === "string" && val.startsWith("var(")) {
      const varName = val.slice(4, -1).trim();
      const extracted = computed.getPropertyValue(varName).trim();
      // If variable is empty (e.g. from missing custom CSS injection timing),
      // we don't want to return empty string because it will break canvas
      if (extracted) return extracted;
      
      // Attempt to provide a fallback color based on the property name to avoid crashing
      if (val.includes("bg-start")) return "#ffffff";
      if (val.includes("bg-end")) return "#f3f4f6";
      if (val.includes("text")) return "#000000";
      if (val.includes("accent")) return "#3b82f6";
      if (val.includes("card")) return "#ffffff";
      return "transparent";
    }
    return val;
  };

  return {
    bgStart: resolveVar(defaults.bgStart) as string,
    bgEnd: resolveVar(defaults.bgEnd) as string,
    text: resolveVar(defaults.text) as string,
    accent: resolveVar(defaults.accent) as string,
    card: resolveVar(defaults.card) as string,
    shapeBorderWidth: defaults.shapeBorderWidth,
    shapeBorderColor: defaults.shapeBorderColor,
    shapeShadowX: defaults.shapeShadowX,
    shapeShadowY: defaults.shapeShadowY,
    shapeShadowBlur: defaults.shapeShadowBlur,
    shapeShadowColor: defaults.shapeShadowColor,
    shapeRadius: defaults.shapeRadius,
    fontHeading: (resolveVar(defaults.fontHeading || "Poppins, sans-serif") as string) || "Poppins, sans-serif",
    fontBody: (resolveVar(defaults.fontBody || "Inter, sans-serif") as string) || "Inter, sans-serif",
    bgPattern: (resolveVar(defaults.bgPattern || "none") as string) || "none",
  };
}

function getFallbackTokens(themeKey: string): ThemeTokens {
  // Hardcoded fallbacks when CSS variables are not yet readable
  const map: Record<string, Partial<ThemeTokens>> = {
    aurora: { 
      bgStart: "#baf3ff", 
      bgEnd: "#ecfeff", 
      text: "#0f172a", 
      accent: "#0e7490", 
      card: "#f0f9ff",
      fontHeading: "Poppins, sans-serif",
      fontBody: "Inter, sans-serif",
    },
    ember: { 
      bgStart: "#ffd8c2", 
      bgEnd: "#fff2e8", 
      text: "#3f1d13", 
      accent: "#b42318", 
      card: "#fff1ea",
      fontHeading: "Poppins, sans-serif",
      fontBody: "Inter, sans-serif",
    },
    mono: { 
      bgStart: "#e4e4e7", 
      bgEnd: "#f8fafc", 
      text: "#111827", 
      accent: "#1f2937", 
      card: "#ffffff",
      fontHeading: "Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
    "soft-brutalism": { 
      bgStart: "#f4f4f0", 
      bgEnd: "#f4f4f0", 
      text: "#1a1a1a", 
      accent: "#ff5e5e", 
      card: "#ffffff",
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "Inter, sans-serif",
    },
    neumorphism: { 
      bgStart: "#e0e5ec", 
      bgEnd: "#e0e5ec", 
      text: "#4a5568", 
      accent: "#3182ce", 
      card: "#e0e5ec",
      fontHeading: "Poppins, sans-serif",
      fontBody: "Inter, sans-serif",
    },
    midnight: {
      bgStart: "#0f172a",
      bgEnd: "#1e293b",
      text: "#f8fafc",
      accent: "#38bdf8",
      card: "#1e293b",
      fontHeading: "Poppins, sans-serif",
      fontBody: "Inter, sans-serif",
    },
    sunset: {
      bgStart: "#2d1b2e",
      bgEnd: "#4a2b38",
      text: "#fff0f5",
      accent: "#ff7b9c",
      card: "#3a2230",
      fontHeading: "Poppins, sans-serif",
      fontBody: "Poppins, sans-serif",
    }
  };
  
  const base = themeStyles[themeKey as ThemeKey] || {
    bgStart: "#ffffff",
    bgEnd: "#ffffff",
    text: "#000000",
    accent: "#000000",
    card: "#ffffff",
    shapeBorderWidth: 0,
    shapeBorderColor: "transparent",
    shapeShadowX: 0,
    shapeShadowY: 0,
    shapeShadowBlur: 0,
    shapeShadowColor: "transparent",
    shapeRadius: 0,
    fontHeading: "Poppins, sans-serif",
    fontBody: "Inter, sans-serif",
  };
  
  return { ...base, ...(map[themeKey] || {}) } as ThemeTokens;
}
