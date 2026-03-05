import type { Slide, AspectRatio } from "@/lib/types";
import { themeStyles } from "@/lib/constants";

type SlideSidebarProps = {
  slides: Slide[];
  activeSlideId: string | null;
  draggingSlideId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  onSelectSlide: (id: string) => void;
  
  // Settings props
  activeAspectRatio: AspectRatio;
  setAspectRatio: (value: AspectRatio) => void;
  aspectRatioControlledByMarkdown: boolean;
  activeThemeKey: string;
  setSelectedTheme: (value: string) => void;
  themeControlledByMarkdown: boolean;
  showGuides: boolean;
  setShowGuides: (value: boolean) => void;
  showSafeArea: boolean;
  setShowSafeArea: (value: boolean) => void;
  customThemes: Record<string, string>;
  onOpenCustomThemeDialog: () => void;
  onEditCustomTheme: (themeName: string) => void;
  onDeleteCustomTheme: (themeName: string) => void;
};

export default function SlideSidebar({
  slides,
  activeSlideId,
  draggingSlideId,
  onDragStart,
  onDragEnd,
  onDrop,
  onSelectSlide,
  activeAspectRatio,
  setAspectRatio,
  aspectRatioControlledByMarkdown,
  activeThemeKey,
  setSelectedTheme,
  themeControlledByMarkdown,
  showGuides,
  setShowGuides,
  showSafeArea,
  setShowSafeArea,
  customThemes,
  onOpenCustomThemeDialog,
  onEditCustomTheme,
  onDeleteCustomTheme,
}: SlideSidebarProps) {
  return (
    <div className="h-full bg-black/20 backdrop-blur-md border-r border-white/5 flex flex-col w-64 shrink-0 overflow-hidden text-sm font-body">
      {/* Settings Section */}
      <div className="p-4 border-b border-white/5 space-y-4 shrink-0">
        <div className="text-gray-400 font-medium text-xs tracking-wider uppercase mb-2">Settings</div>
        
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Format</label>
            <select
              value={activeAspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/30 w-full"
              title={aspectRatioControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Aspect Ratio"}
            >
              <option value="4:5" className="bg-[#1e1e1e]">Portrait 4:5</option>
              <option value="1:1" className="bg-[#1e1e1e]">Square 1:1</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider flex justify-between">
              <span>Theme</span>
              <button 
                onClick={onOpenCustomThemeDialog}
                className="text-indigo hover:text-indigo/80 transition-colors"
                title="Add custom theme"
              >
                + Add Custom
              </button>
            </label>
            <select
              value={activeThemeKey}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/30 w-full"
              title={themeControlledByMarkdown ? "Currently using markdown frontmatter (select to override)" : "Theme"}
            >
              <optgroup label="Default Themes">
                {Object.keys(themeStyles).map((theme) => (
                  <option key={theme} value={theme} className="bg-[#1e1e1e]">
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </optgroup>
              
              {Object.keys(customThemes).length > 0 && (
                <optgroup label="Custom Themes">
                  {Object.keys(customThemes).map((theme) => (
                    <option key={theme} value={theme} className="bg-[#1e1e1e]">
                      {theme}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            
            {/* Show edit/delete buttons if a custom theme is currently selected */}
            {activeThemeKey in customThemes && (
              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={() => onEditCustomTheme(activeThemeKey)}
                  className="text-[10px] text-indigo/80 hover:text-indigo transition-colors"
                >
                  Edit Theme
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the theme '${activeThemeKey}'?`)) {
                      onDeleteCustomTheme(activeThemeKey);
                    }
                  }}
                  className="text-[10px] text-coral/80 hover:text-coral transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 pt-2">
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
          </div>
        </div>
      </div>

      {/* Slides List */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-white/5">
        <span className="text-gray-400 font-medium text-xs tracking-wider uppercase">Slides</span>
        <span className="ml-auto bg-white/5 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/10">
          {slides.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scroll-smooth">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={() => onDragStart(slide.id)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(slide.id);
            }}
            onDragEnd={onDragEnd}
            onClick={() => onSelectSlide(slide.id)}
            className={`
              group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 border
              ${activeSlideId === slide.id 
                ? "bg-indigo/20 border-indigo/40 text-white shadow-[0_0_15px_rgba(91,63,255,0.2)]" 
                : "bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }
              ${draggingSlideId === slide.id ? "opacity-40 scale-95" : "opacity-100 scale-100"}
              ${draggingSlideId && draggingSlideId !== slide.id ? "hover:border-indigo/50 hover:border-dashed" : ""}
            `}
          >
            <div className={`font-mono text-xs w-5 text-right shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${activeSlideId === slide.id ? "text-indigo/80 opacity-100" : ""}`}>
              {index + 1}
            </div>
            <div className="flex-1 truncate font-medium">
              {slide.title || "Untitled Slide"}
            </div>
            
            {slide.errors.length > 0 && (
              <div 
                className="w-4 h-4 rounded-full bg-coral/20 text-coral flex items-center justify-center text-[10px] shrink-0 font-bold"
                title={`${slide.errors.length} errors`}
              >
                !
              </div>
            )}
            
            <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-500 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}