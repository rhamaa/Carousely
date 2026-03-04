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

function extractTokens(themeKey: ThemeKey, element?: HTMLElement): ThemeTokens {
  const defaults = themeStyles[themeKey];
  
  if (!element || typeof window === "undefined") {
    // Return fallback values for SSR or initial render
    return getFallbackTokens(themeKey);
  }

  const computed = window.getComputedStyle(element);
  
  const resolveVar = (val: string | number) => {
    if (typeof val === "string" && val.startsWith("var(")) {
      const varName = val.slice(4, -1).trim();
      const extracted = computed.getPropertyValue(varName).trim();
      return extracted || val;
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
  };
}

function getFallbackTokens(themeKey: ThemeKey): ThemeTokens {
  // Hardcoded fallbacks when CSS variables are not yet readable
  const map: Record<ThemeKey, Partial<ThemeTokens>> = {
    aurora: { bgStart: "#baf3ff", bgEnd: "#ecfeff", text: "#0f172a", accent: "#0e7490", card: "#f0f9ff" },
    ember: { bgStart: "#ffd8c2", bgEnd: "#fff2e8", text: "#3f1d13", accent: "#b42318", card: "#fff1ea" },
    mono: { bgStart: "#e4e4e7", bgEnd: "#f8fafc", text: "#111827", accent: "#1f2937", card: "#ffffff" },
    "soft-brutalism": { bgStart: "#f4f4f0", bgEnd: "#f4f4f0", text: "#1a1a1a", accent: "#ff5e5e", card: "#ffffff" },
    neumorphism: { bgStart: "#e0e5ec", bgEnd: "#e0e5ec", text: "#4a5568", accent: "#3182ce", card: "#e0e5ec" },
  };
  
  const base = themeStyles[themeKey];
  return { ...base, ...map[themeKey] } as ThemeTokens;
}
