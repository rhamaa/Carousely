import type { Slide, KonvaRuntime, StageHandle } from "@/lib/types";
import { themeStyles } from "@/lib/constants";
import { estimateTextHeight, clamp } from "@/lib/utils";
import type { ReactNode } from "react";

type SlidePreviewProps = {
  orderedSlides: Slide[];
  activeSlideId: string | null;
  setActiveSlideId: (id: string) => void;
  stageSize: { width: number; height: number };
  activeAspectRatio: string;
  activeFont: { label: string };
  headingFontFamily: string;
  bodyFontFamily: string;
  activeTheme: typeof themeStyles[keyof typeof themeStyles];
  showGuides: boolean;
  showSafeArea: boolean;
  konvaRuntime: KonvaRuntime | null;
  stageRefs: React.MutableRefObject<Map<string, StageHandle>>;
};

export default function SlidePreview({
  orderedSlides,
  activeSlideId,
  setActiveSlideId,
  stageSize,
  activeAspectRatio,
  activeFont,
  headingFontFamily,
  bodyFontFamily,
  activeTheme,
  showGuides,
  showSafeArea,
  konvaRuntime,
  stageRefs,
}: SlidePreviewProps) {
  const previewWidth = 340;
  const previewHeight = Math.round((stageSize.height / stageSize.width) * previewWidth);

  const StageComponent = konvaRuntime?.Stage;
  const LayerComponent = konvaRuntime?.Layer;
  const GroupComponent = konvaRuntime?.Group;
  const RectComponent = konvaRuntime?.Rect;
  const LineComponent = konvaRuntime?.Line;
  const TextComponent = konvaRuntime?.Text;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-medium text-xs tracking-wider uppercase">Live Preview</span>
          <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono border border-cyan-500/20">
            HQ Canvas
          </span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono flex gap-3">
          <span>Mode: {activeAspectRatio}</span>
          <span>Font: {activeFont.label}</span>
        </div>
      </div>

      {!konvaRuntime && (
        <div className="p-4 text-xs text-amber-400/80 font-mono bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Canvas Engine...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-6 pb-8">
          {orderedSlides.map((slide, index) => (
            <article
              id={`preview-${slide.id}`}
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer ${
                activeSlideId === slide.id 
                  ? "ring-2 ring-cyan-500 ring-offset-4 ring-offset-[#1a1a1a] shadow-cyan-500/20" 
                  : "ring-1 ring-white/5 hover:ring-white/20"
              }`}
              style={{ width: previewWidth }}
            >
              <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/90 border border-white/10 shadow-sm pointer-events-none">
                {String(index + 1).padStart(2, '0')}
              </div>

              {slide.errors.length > 0 && (
                <div className="absolute top-3 right-3 z-10 bg-rose-500/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-white border border-rose-400/50 shadow-sm flex items-center gap-1 pointer-events-none">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {slide.errors.length}
                </div>
              )}

              {StageComponent && LayerComponent && GroupComponent && RectComponent && LineComponent && TextComponent ? (
                <StageComponent
                  width={stageSize.width}
                  height={stageSize.height}
                  scaleX={previewWidth / stageSize.width}
                  scaleY={previewWidth / stageSize.width}
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    background: "#020617",
                    display: "block",
                  }}
                  ref={(node: StageHandle | null) => {
                    if (node) {
                      stageRefs.current.set(slide.id, node as StageHandle);
                    } else {
                      stageRefs.current.delete(slide.id);
                    }
                  }}
                >
                  <LayerComponent>
                    <RectComponent
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{ x: stageSize.width, y: stageSize.height }}
                      fillLinearGradientColorStops={[0, activeTheme.bgStart, 1, activeTheme.bgEnd]}
                    />

                    {showGuides && (
                      <GroupComponent>
                        {[1, 2].map((divider) => (
                          <LineComponent
                            key={`vertical-${divider}`}
                            points={[
                              (stageSize.width / 3) * divider,
                              0,
                              (stageSize.width / 3) * divider,
                              stageSize.height,
                            ]}
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth={2}
                            dash={[8, 10]}
                          />
                        ))}
                        {[1, 2].map((divider) => (
                          <LineComponent
                            key={`horizontal-${divider}`}
                            points={[
                              0,
                              (stageSize.height / 3) * divider,
                              stageSize.width,
                              (stageSize.height / 3) * divider,
                            ]}
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth={2}
                            dash={[8, 10]}
                          />
                        ))}
                      </GroupComponent>
                    )}

                    {(() => {
                      const safeMarginX = stageSize.width * 0.08;
                      const safeMarginY = stageSize.height * 0.07;
                      const safeArea = {
                        x: safeMarginX,
                        y: safeMarginY,
                        width: stageSize.width - safeMarginX * 2,
                        height: stageSize.height - safeMarginY * 2,
                      };

                      const nodes: ReactNode[] = [];
                      const textWidth = safeArea.width - 64;

                      let cursorY = safeArea.y + 150;
                      const minY = safeArea.y + 120;
                      const maxY = safeArea.y + safeArea.height - 120;

                      nodes.push(
                        <TextComponent
                          key={`title-${slide.id}`}
                          x={safeArea.x + 32}
                          y={safeArea.y + 36}
                          width={textWidth}
                          text={slide.title}
                          fill={activeTheme.text}
                          fontSize={56}
                          lineHeight={1.2}
                          fontStyle="bold"
                          fontFamily={headingFontFamily}
                        />,
                      );

                      slide.blocks.forEach((block, blockIndex) => {
                        const key = `${slide.id}-${block.kind}-${blockIndex}`;

                        if (block.kind === "paragraph") {
                          const height = estimateTextHeight(block.text, textWidth, 30, 1.5);
                          nodes.push(
                            <TextComponent
                              key={key}
                              x={safeArea.x + 32}
                              y={cursorY}
                              width={textWidth}
                              text={block.text}
                              fill={activeTheme.text}
                              fontSize={30}
                              lineHeight={1.45}
                              fontFamily={bodyFontFamily}
                            />,
                          );
                          cursorY += height + 20;
                          return;
                        }

                        if (block.kind === "bullet-list" || block.kind === "ordered-list") {
                          block.items.forEach((item, itemIndex) => {
                            const label = block.kind === "ordered-list" ? `${itemIndex + 1}.` : "•";
                            const line = `${label} ${item}`;
                            const itemHeight = estimateTextHeight(line, textWidth, 28, 1.45);
                            nodes.push(
                              <TextComponent
                                key={`${key}-${item}`}
                                x={safeArea.x + 32}
                                y={cursorY}
                                width={textWidth}
                                text={line}
                                fill={activeTheme.text}
                                fontSize={28}
                                lineHeight={1.4}
                                fontFamily={bodyFontFamily}
                              />,
                            );
                            cursorY += itemHeight + 12;
                          });
                          cursorY += 8;
                          return;
                        }

                        if (block.kind === "quote") {
                          const cardHeight = estimateTextHeight(block.text, textWidth - 48, 27, 1.45) + 56;
                          nodes.push(
                            <GroupComponent key={key}>
                              <RectComponent
                                x={safeArea.x + 24}
                                y={cursorY}
                                width={textWidth + 16}
                                height={cardHeight}
                                fill={activeTheme.card}
                                cornerRadius={24}
                                shadowColor="#0f172a"
                                shadowBlur={16}
                                shadowOpacity={0.08}
                              />
                              <TextComponent
                                x={safeArea.x + 48}
                                y={cursorY + 26}
                                width={textWidth - 40}
                                text={`“${block.text}”`}
                                fill={activeTheme.text}
                                fontSize={27}
                                lineHeight={1.4}
                                fontFamily={bodyFontFamily}
                              />
                            </GroupComponent>,
                          );
                          cursorY += cardHeight + 18;
                          return;
                        }

                        if (block.kind === "cta") {
                          const buttonHeight = 90;
                          const buttonY = clamp(cursorY, minY, maxY - buttonHeight);
                          nodes.push(
                            <GroupComponent key={key}>
                              <RectComponent
                                x={safeArea.x + 24}
                                y={buttonY}
                                width={textWidth + 16}
                                height={buttonHeight}
                                cornerRadius={999}
                                fill={block.style === "secondary" ? "transparent" : activeTheme.accent}
                                stroke={activeTheme.accent}
                                strokeWidth={3}
                              />
                              <TextComponent
                                x={safeArea.x + 24}
                                y={buttonY + 26}
                                width={textWidth + 16}
                                align="center"
                                text={block.text}
                                fill={block.style === "secondary" ? activeTheme.accent : "#ffffff"}
                                fontSize={30}
                                fontStyle="bold"
                                fontFamily={bodyFontFamily}
                              />
                            </GroupComponent>,
                          );
                          cursorY = buttonY + buttonHeight + 16;
                          return;
                        }

                        if (block.kind === "agenda") {
                          const columns = clamp(block.columns ?? 1, 1, 2);
                          const columnWidth = columns === 2 ? (textWidth - 16) / 2 : textWidth;
                          const rowHeight = 48;
                          const cardHeight = 72 + Math.ceil(block.items.length / columns) * rowHeight;

                          nodes.push(
                            <GroupComponent key={key}>
                              <RectComponent
                                x={safeArea.x + 24}
                                y={cursorY}
                                width={textWidth + 16}
                                height={cardHeight}
                                fill={activeTheme.card}
                                cornerRadius={24}
                              />
                              {block.title ? (
                                <TextComponent
                                  x={safeArea.x + 48}
                                  y={cursorY + 22}
                                  width={textWidth - 32}
                                  text={block.title.toUpperCase()}
                                  fill={activeTheme.accent}
                                  fontSize={20}
                                  letterSpacing={2}
                                  fontStyle="bold"
                                  fontFamily={bodyFontFamily}
                                />
                              ) : null}
                              {block.items.map((item, agendaIndex) => {
                                const column = agendaIndex % columns;
                                const row = Math.floor(agendaIndex / columns);
                                return (
                                  <TextComponent
                                    key={`${key}-${item}`}
                                    x={safeArea.x + 48 + column * (columnWidth + 16)}
                                    y={cursorY + 64 + row * rowHeight}
                                    width={columnWidth}
                                    text={`• ${item}`}
                                    fill={activeTheme.text}
                                    fontSize={24}
                                    fontFamily={bodyFontFamily}
                                  />
                                );
                              })}
                            </GroupComponent>,
                          );

                          cursorY += cardHeight + 18;
                          return;
                        }

                        const imageHeight = block.ratio === "portrait" ? 340 : block.ratio === "square" ? 260 : 210;
                        nodes.push(
                          <GroupComponent key={key}>
                            <RectComponent
                              x={safeArea.x + 24}
                              y={cursorY}
                              width={textWidth + 16}
                              height={imageHeight}
                              fill="#e2e8f0"
                              stroke={activeTheme.accent}
                              strokeWidth={2}
                              dash={[10, 8]}
                              cornerRadius={24}
                            />
                            <TextComponent
                              x={safeArea.x + 24}
                              y={cursorY + imageHeight / 2 - 26}
                              width={textWidth + 16}
                              text={`IMG · ${block.alt || "image"}`}
                              align="center"
                              fill={activeTheme.accent}
                              fontSize={22}
                              fontStyle="bold"
                              fontFamily={bodyFontFamily}
                            />
                            <TextComponent
                              x={safeArea.x + 24}
                              y={cursorY + imageHeight / 2 + 8}
                              width={textWidth + 16}
                              align="center"
                              text={`${block.ratio ?? "auto"} · ${block.align ?? "center"}`}
                              fill="#334155"
                              fontSize={16}
                              fontFamily={bodyFontFamily}
                            />
                          </GroupComponent>,
                        );
                        cursorY += imageHeight + 18;
                      });

                      return (
                        <>
                          {showSafeArea && (
                            <RectComponent
                              x={safeArea.x}
                              y={safeArea.y}
                              width={safeArea.width}
                              height={safeArea.height}
                              stroke="rgba(14,116,144,0.9)"
                              strokeWidth={3}
                              dash={[12, 8]}
                              cornerRadius={30}
                            />
                          )}
                          {nodes}
                          {slide.errors.length > 0 && (
                            <TextComponent
                              x={safeArea.x + 32}
                              y={stageSize.height - 62}
                              width={safeArea.width - 64}
                              text={`Parser warning: ${slide.errors[0]}`}
                              fill="#b91c1c"
                              fontSize={20}
                              fontStyle="bold"
                              fontFamily={bodyFontFamily}
                            />
                          )}
                        </>
                      );
                    })()}
                  </LayerComponent>
                </StageComponent>
              ) : (
                <div
                  style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
                  className="bg-black/50"
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}