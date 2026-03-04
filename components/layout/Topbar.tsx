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
    <div className="h-14 border-b border-gray-800 bg-[#252526] px-4 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
          <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg leading-none">
            C
          </div>
          <span className="font-semibold text-gray-200 tracking-wide text-sm">Carousely</span>
          {isDesktopShell && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono tracking-wider uppercase ml-1">
              Desktop
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onOpenProject}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            Open
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onSaveProjectAs}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            Save As
          </button>
        </div>

        <div className="h-4 w-px bg-gray-700 mx-1" />

        <div className="flex items-center gap-3">
          <select
            value={activeAspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-[#333333] border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-cyan-500"
            title={aspectRatioControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Aspect Ratio"}
          >
            <option value="4:5">Portrait 4:5</option>
            <option value="1:1">Square 1:1</option>
          </select>

          <select
            value={activeThemeKey}
            onChange={(e) => setSelectedTheme(e.target.value as ThemeKey)}
            className="bg-[#333333] border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-cyan-500"
            title={themeControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Theme"}
          >
            {Object.keys(themeStyles).map((theme) => (
              <option key={theme} value={theme}>
                Theme: {theme}
              </option>
            ))}
          </select>

          <select
            value={fontPreset}
            onChange={(e) => setFontPreset(e.target.value as FontPreset)}
            className="bg-[#333333] border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-cyan-500"
            title="Font Preset"
          >
            {Object.entries(fontPresets).map(([key, value]) => (
              <option key={key} value={key}>
                Font: {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
          <input
            type="checkbox"
            checked={showGuides}
            onChange={(e) => setShowGuides(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5"
          />
          Guides
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
          <input
            type="checkbox"
            checked={showSafeArea}
            onChange={(e) => setShowSafeArea(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5"
          />
          Safe Area
        </label>

        <div className="h-4 w-px bg-gray-700 mx-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportPng}
            disabled={isExportingPng}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {isExportingPng ? "Rendering..." : "Export PNG"}
          </button>
          <button
            type="button"
            onClick={onExportZip}
            disabled={isExportingZip}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {isExportingZip ? "Zipping..." : "Export ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}
