import type { AspectRatio, FontPreset, DesktopContext } from "@/lib/types";
import { themeStyles, fontPresets } from "@/lib/constants";
import type { ThemeKey } from "@/lib/constants";

type TopbarProps = {
  activeAspectRatio: AspectRatio;
  setAspectRatio: (value: AspectRatio) => void;
  aspectRatioControlledByMarkdown: boolean;
  activeThemeKey: ThemeKey;
  setSelectedTheme: (value: ThemeKey) => void;
  themeControlledByMarkdown: boolean;
  fontPreset: FontPreset;
  setFontPreset: (value: FontPreset) => void;
  showGuides: boolean;
  setShowGuides: (value: boolean) => void;
  showSafeArea: boolean;
  setShowSafeArea: (value: boolean) => void;
  isDesktopShell: boolean;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onExportPng: () => void;
  isExportingPng: boolean;
  onExportZip: () => void;
  isExportingZip: boolean;
};

export default function Topbar({
  activeAspectRatio,
  setAspectRatio,
  aspectRatioControlledByMarkdown,
  activeThemeKey,
  setSelectedTheme,
  themeControlledByMarkdown,
  fontPreset,
  setFontPreset,
  showGuides,
  setShowGuides,
  showSafeArea,
  setShowSafeArea,
  isDesktopShell,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExportPng,
  isExportingPng,
  onExportZip,
  isExportingZip,
}: TopbarProps) {
  return (
    <div className="h-14 border-b border-white/5 bg-black/20 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none relative z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo to-coral text-white flex items-center justify-center font-bold text-lg leading-none shadow-sm">
            C
          </div>
          <span className="font-semibold text-white tracking-wide text-sm font-heading">Carousely</span>
          {isDesktopShell && (
            <span className="text-[10px] bg-indigo/10 text-indigo px-1.5 py-0.5 rounded border border-indigo/20 font-mono tracking-wider uppercase ml-1">
              Desktop
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onOpenProject}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Open
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onSaveProjectAs}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Save As
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-3">
          <select
            value={activeAspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-indigo backdrop-blur-md"
            title={aspectRatioControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Aspect Ratio"}
          >
            <option value="4:5" className="bg-[#1e1e1e]">Portrait 4:5</option>
            <option value="1:1" className="bg-[#1e1e1e]">Square 1:1</option>
          </select>

          <select
            value={activeThemeKey}
            onChange={(e) => setSelectedTheme(e.target.value as ThemeKey)}
            className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-indigo backdrop-blur-md"
            title={themeControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Theme"}
          >
            {Object.keys(themeStyles).map((theme) => (
              <option key={theme} value={theme} className="bg-[#1e1e1e]">
                Theme: {theme}
              </option>
            ))}
          </select>

          <select
            value={fontPreset}
            onChange={(e) => setFontPreset(e.target.value as FontPreset)}
            className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-indigo backdrop-blur-md"
            title="Font Preset"
          >
            {Object.entries(fontPresets).map(([key, value]) => (
              <option key={key} value={key} className="bg-[#1e1e1e]">
                Font: {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={showGuides}
            onChange={(e) => setShowGuides(e.target.checked)}
            className="rounded border-white/20 bg-black/20 text-indigo focus:ring-indigo/30 w-3.5 h-3.5"
          />
          Guides
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={showSafeArea}
            onChange={(e) => setShowSafeArea(e.target.checked)}
            className="rounded border-white/20 bg-black/20 text-indigo focus:ring-indigo/30 w-3.5 h-3.5"
          />
          Safe Area
        </label>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportPng}
            disabled={isExportingPng}
            className="text-xs bg-gradient-to-r from-indigo to-coral hover:opacity-90 hover:scale-[1.02] hover:shadow-md text-white px-4 py-1.5 rounded transition-all disabled:opacity-50 disabled:hover:scale-100 font-medium"
          >
            {isExportingPng ? "Crafting..." : "Export PNG"}
          </button>
          <button
            type="button"
            onClick={onExportZip}
            disabled={isExportingZip}
            className="text-xs border border-coral text-coral hover:bg-coral/10 hover:scale-[1.02] px-4 py-1.5 rounded transition-all disabled:opacity-50 disabled:hover:scale-100 font-medium"
          >
            {isExportingZip ? "Zipping..." : "Export ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}
