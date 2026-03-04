import type { Slide } from "@/lib/types";

type SlideSidebarProps = {
  slides: Slide[];
  activeSlideId: string | null;
  draggingSlideId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  onSelectSlide: (id: string) => void;
};

export default function SlideSidebar({
  slides,
  activeSlideId,
  draggingSlideId,
  onDragStart,
  onDragEnd,
  onDrop,
  onSelectSlide,
}: SlideSidebarProps) {
  return (
    <div className="h-full bg-[#1e1e1e] border-r border-gray-800 flex flex-col w-64 shrink-0 overflow-hidden text-sm">
      <div className="h-10 border-b border-gray-800 flex items-center px-4 shrink-0">
        <span className="text-gray-400 font-medium text-xs tracking-wider uppercase">Slides</span>
        <span className="ml-auto bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
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
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-50" 
                : "bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }
              ${draggingSlideId === slide.id ? "opacity-40 scale-95" : "opacity-100 scale-100"}
              ${draggingSlideId && draggingSlideId !== slide.id ? "hover:border-cyan-500/50 hover:border-dashed" : ""}
            `}
          >
            <div className={`font-mono text-xs w-5 text-right shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${activeSlideId === slide.id ? "text-cyan-400 opacity-100" : ""}`}>
              {index + 1}
            </div>
            <div className="flex-1 truncate font-medium">
              {slide.title || "Untitled Slide"}
            </div>
            
            {slide.errors.length > 0 && (
              <div 
                className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] shrink-0"
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