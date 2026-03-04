import { useState } from "react";
import type { ThemeTokens } from "@/lib/types";
import { themeStyles } from "@/lib/constants";

export const defaultThemeTemplate = `[data-theme="my-custom-theme"] {
  --slide-bg-start: #ffffff;
  --slide-bg-end: #f3f4f6;
  --slide-text: #111827;
  --slide-accent: #3b82f6;
  --slide-card-bg: #ffffff;
  
  --shape-border-width: 1px;
  --shape-border-color: #e5e7eb;
  --shape-shadow-x: 0px;
  --shape-shadow-y: 4px;
  --shape-shadow-blur: 12px;
  --shape-shadow-color: rgba(0, 0, 0, 0.05);
  --shape-radius: 12px;
  
  --slide-font-heading: "Inter", sans-serif;
  --slide-font-body: "Inter", sans-serif;
}`;

type CustomThemeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (themeName: string, cssContent: string) => void;
};

export default function CustomThemeDialog({ isOpen, onClose, onSave }: CustomThemeDialogProps) {
  const [themeName, setThemeName] = useState("my-custom-theme");
  const [cssContent, setCssContent] = useState(defaultThemeTemplate);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    // Basic validation
    const normalizedName = themeName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    
    if (!normalizedName) {
      setError("Theme name is required");
      return;
    }

    if (Object.keys(themeStyles).includes(normalizedName)) {
      setError("Theme name conflicts with a built-in theme");
      return;
    }

    if (!cssContent.includes(`[data-theme="${normalizedName}"]`)) {
      setError(`CSS must contain the selector [data-theme="${normalizedName}"]`);
      return;
    }

    setError(null);
    onSave(normalizedName, cssContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-body">
      <div className="bg-[#11131A] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-lg font-semibold text-white tracking-wide">Add Custom Theme</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-400 font-mono mb-1.5">Theme Name</label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => {
                setThemeName(e.target.value);
                setError(null);
              }}
              placeholder="my-custom-theme"
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo transition-colors"
            />
          </div>

          <div className="flex-1 min-h-[300px] flex flex-col">
            <label className="block text-xs text-gray-400 font-mono mb-1.5 flex justify-between">
              <span>CSS Variables</span>
              <span className="text-indigo/70 text-[10px]">Use standard standard CSS rules</span>
            </label>
            <textarea
              value={cssContent}
              onChange={(e) => {
                setCssContent(e.target.value);
                setError(null);
              }}
              className="w-full flex-1 bg-black/40 border border-white/10 rounded p-4 text-xs text-gray-300 font-mono resize-none focus:outline-none focus:border-indigo transition-colors custom-scrollbar"
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="text-xs text-coral bg-coral/10 p-2 rounded border border-coral/20 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo hover:bg-indigo/90 text-white rounded shadow-md transition-all font-medium"
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}
