import type { Slide, KonvaRuntime, StageHandle } from "@/lib/types";
import { themeStyles } from "@/lib/constants";
import { estimateTextHeight, clamp } from "@/lib/utils";
import { useThemeTokens } from "@/lib/use-theme-tokens";
import type { ThemeKey } from "@/lib/constants";
import { Html } from "react-konva-utils";
import { marked } from "marked";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import parseHtml from "html-react-parser";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type SlidePreviewProps = {
  orderedSlides: Slide[];
  activeSlideId: string | null;
  setActiveSlideId: (id: string) => void;
  stageSize: { width: number; height: number };
  activeAspectRatio: string;
  activeThemeKey: ThemeKey;
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
  activeThemeKey,
  showGuides,
  showSafeArea,
  konvaRuntime,
  stageRefs,
}: SlidePreviewProps) {
  const previewWidth = 340;
  const previewHeight = Math.round((stageSize.height / stageSize.width) * previewWidth);
  const activeTheme = useThemeTokens(activeThemeKey);

  const StageComponent = konvaRuntime?.Stage;
  const LayerComponent = konvaRuntime?.Layer;
  const GroupComponent = konvaRuntime?.Group;
  const RectComponent = konvaRuntime?.Rect;
  const LineComponent = konvaRuntime?.Line;
  const TextComponent = konvaRuntime?.Text;
  const ImageComponent = konvaRuntime?.Image;

  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement | null>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const imageBlocks = orderedSlides.flatMap((slide) =>
      slide.blocks.filter((b): b is Extract<typeof b, { kind: "image" }> => b.kind === "image"),
    );

    imageBlocks.forEach((block) => {
      if (imageCache[block.src] !== undefined) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setImageCache((prev) => ({ ...prev, [block.src]: img }));
      img.onerror = () => setImageCache((prev) => ({ ...prev, [block.src]: null }));
      img.src = block.src;
    });
  }, [orderedSlides, imageCache]);

  const getCoverLayout = (img: HTMLImageElement, containerWidth: number, containerHeight: number) => {
    const scale = Math.max(containerWidth / img.width, containerHeight / img.height);
    const width = img.width * scale;
    const height = img.height * scale;
    const x = (containerWidth - width) / 2;
    const y = (containerHeight - height) / 2;
    return { width, height, x, y };
  };

  // We parse markdown inline to html string for the text blocks.
  const renderRichText = (text: string) => {
    try {
      const htmlString = marked.parseInline(text) as string;
      return parseHtml(htmlString);
    } catch {
      return text;
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent font-body">
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-black/10 backdrop-blur-md shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-bold text-xs tracking-wider uppercase font-heading">Live Preview</span>
          <span className="bg-indigo/20 text-indigo text-[10px] px-2 py-0.5 rounded font-mono border border-indigo/30">
            HQ Canvas
          </span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono flex gap-3">
          <span>Mode: {activeAspectRatio}</span>
          <span>Theme: {activeThemeKey}</span>
        </div>
      </div>

      {!konvaRuntime && (
        <div className="p-4 text-xs text-coral font-mono bg-coral/10 border-b border-coral/20 flex items-center gap-2 backdrop-blur-md">
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Canvas Engine...
        </div>
      )}

      <div className="flex-1 overflow-hidden relative bg-[#0f1115]">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={4}
          centerOnInit
          limitToBounds={false}
          panning={{
            disabled: false,
            velocityDisabled: true,
            allowLeftClickPan: true,
          }}
          wheel={{
            step: 0.1,
            activationKeys: ["Control", "Meta"]
          }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
            }}
            contentStyle={{
              padding: "4rem",
            }}
          >
            <div className="flex flex-row items-center gap-12">
              {orderedSlides.map((slide, index) => (
                <article
                  id={`preview-${slide.id}`}
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    activeSlideId === slide.id
                      ? "ring-4 ring-indigo ring-offset-4 ring-offset-black/50 shadow-xl shadow-indigo/20 scale-[1.02]"
                      : "ring-1 ring-white/10 hover:ring-indigo/50 shadow-lg hover:shadow-indigo/10"
                  }`}
                  style={{ width: previewWidth }}
                >
                  {activeSlideId === slide.id && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-indigo z-20 rounded-xl" />
                  )}
                  <div className="absolute top-3 left-3 z-10 bg-dark-gray/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/90 border border-white/10 shadow-sm pointer-events-none">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {slide.errors.length > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-coral/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-white border border-white/20 shadow-sm flex items-center gap-1 pointer-events-none">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {slide.errors.length}
                    </div>
                  )}

                  {StageComponent && LayerComponent && GroupComponent && RectComponent && LineComponent && TextComponent && ImageComponent ? (
                    <StageComponent
                      width={previewWidth}
                      height={previewHeight}
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
                            {[1, 2, 3, 4, 5].map((divider) => (
                              <LineComponent
                                key={`grid-v-${divider}`}
                                points={[
                                  (stageSize.width / 6) * divider,
                                  0,
                                  (stageSize.width / 6) * divider,
                                  stageSize.height,
                                ]}
                                stroke="#E0E0E0"
                                strokeWidth={1}
                                opacity={0.5}
                              />
                            ))}
                            {[1, 2, 3, 4, 5].map((divider) => (
                              <LineComponent
                                key={`grid-h-${divider}`}
                                points={[
                                  0,
                                  (stageSize.height / 6) * divider,
                                  stageSize.width,
                                  (stageSize.height / 6) * divider,
                                ]}
                                stroke="#E0E0E0"
                                strokeWidth={1}
                                opacity={0.5}
                              />
                            ))}
                            
                            {[1, 2].map((divider) => (
                              <LineComponent
                                key={`vertical-${divider}`}
                                points={[
                                  (stageSize.width / 3) * divider,
                                  0,
                                  (stageSize.width / 3) * divider,
                                  stageSize.height,
                                ]}
                                stroke="var(--color-primary-indigo, #5B3FFF)"
                                strokeWidth={2}
                                opacity={0.6}
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
                                stroke="var(--color-primary-indigo, #5B3FFF)"
                                strokeWidth={2}
                                opacity={0.6}
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
                              fontFamily={activeTheme.fontHeading}
                            />,
                          );

                          slide.blocks.forEach((block, blockIndex) => {
                            const key = `${slide.id}-${block.kind}-${blockIndex}`;

                            if (block.kind === "paragraph") {
                              const height = estimateTextHeight(block.text, textWidth, 30, 1.5);
                              nodes.push(
                                <GroupComponent key={key}>
                                  <Html
                                    divProps={{
                                      style: {
                                        position: "absolute",
                                        left: `${safeArea.x + 32}px`,
                                        top: `${cursorY}px`,
                                        width: `${textWidth}px`,
                                        color: activeTheme.text,
                                        fontSize: "30px",
                                        lineHeight: "1.45",
                                        fontFamily: activeTheme.fontBody,
                                        wordWrap: "break-word",
                                        whiteSpace: "pre-wrap",
                                        pointerEvents: "none", // Prevent HTML from capturing clicks over canvas
                                      },
                                    }}
                                  >
                                    <div className="prose-p-margin-none prose-strong:font-bold prose-em:italic">
                                      {renderRichText(block.text)}
                                    </div>
                                  </Html>
                                </GroupComponent>,
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
                                  <GroupComponent key={`${key}-${item}`}>
                                    <Html
                                      divProps={{
                                        style: {
                                          position: "absolute",
                                          left: `${safeArea.x + 32}px`,
                                          top: `${cursorY}px`,
                                          width: `${textWidth}px`,
                                          color: activeTheme.text,
                                          fontSize: "28px",
                                          lineHeight: "1.4",
                                          fontFamily: activeTheme.fontBody,
                                          wordWrap: "break-word",
                                          whiteSpace: "pre-wrap",
                                          pointerEvents: "none",
                                        },
                                      }}
                                    >
                                      <div className="prose-p-margin-none prose-strong:font-bold prose-em:italic flex gap-2">
                                        <span>{label}</span>
                                        <span>{renderRichText(item)}</span>
                                      </div>
                                    </Html>
                                  </GroupComponent>,
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
                                    cornerRadius={activeTheme.shapeRadius}
                                    stroke={activeTheme.shapeBorderColor}
                                    strokeWidth={activeTheme.shapeBorderWidth}
                                    shadowColor={activeTheme.shapeShadowColor}
                                    shadowBlur={activeTheme.shapeShadowBlur}
                                    shadowOffsetX={activeTheme.shapeShadowX}
                                    shadowOffsetY={activeTheme.shapeShadowY}
                                  />
                                  <TextComponent
                                    x={safeArea.x + 48}
                                    y={cursorY + 26}
                                    width={textWidth - 40}
                                    text={`“${block.text}”`}
                                    fill={activeTheme.text}
                                    fontSize={27}
                                    lineHeight={1.4}
                                    fontFamily={activeTheme.fontBody}
                                  />
                                </GroupComponent>,
                              );
                              cursorY += cardHeight + 18;
                              return;
                            }

                            if (block.kind === "cta") {
                              const buttonHeight = 90;
                              const buttonY = clamp(cursorY, minY, maxY - buttonHeight);

                              const bgBtn = block.style === "secondary" ? "transparent" : activeTheme.accent;
                              const txtBtn = block.style === "secondary" ? activeTheme.accent : activeTheme.card;

                              nodes.push(
                                <GroupComponent key={key}>
                                  <RectComponent
                                    x={safeArea.x + 24}
                                    y={buttonY}
                                    width={textWidth + 16}
                                    height={buttonHeight}
                                    cornerRadius={activeTheme.shapeRadius > 0 ? 999 : 0}
                                    fill={bgBtn}
                                    stroke={activeTheme.accent}
                                    strokeWidth={Math.max(3, activeTheme.shapeBorderWidth)}
                                    shadowColor={activeTheme.shapeShadowColor}
                                    shadowBlur={activeTheme.shapeShadowBlur}
                                    shadowOffsetX={activeTheme.shapeShadowX / 2}
                                    shadowOffsetY={activeTheme.shapeShadowY / 2}
                                  />
                                  <TextComponent
                                    x={safeArea.x + 24}
                                    y={buttonY + 26}
                                    width={textWidth + 16}
                                    align="center"
                                    text={block.text}
                                    fill={txtBtn}
                                    fontSize={30}
                                    fontStyle="bold"
                                    fontFamily={activeTheme.fontBody}
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
                                    cornerRadius={activeTheme.shapeRadius}
                                    stroke={activeTheme.shapeBorderColor}
                                    strokeWidth={activeTheme.shapeBorderWidth}
                                    shadowColor={activeTheme.shapeShadowColor}
                                    shadowBlur={activeTheme.shapeShadowBlur}
                                    shadowOffsetX={activeTheme.shapeShadowX}
                                    shadowOffsetY={activeTheme.shapeShadowY}
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
                                      fontFamily={activeTheme.fontBody}
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
                                        fontFamily={activeTheme.fontBody}
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
                                  fill={activeTheme.card}
                                  stroke={activeTheme.accent}
                                  strokeWidth={Math.max(2, activeTheme.shapeBorderWidth)}
                                  dash={activeTheme.shapeBorderWidth > 0 ? undefined : [10, 8]}
                                  cornerRadius={activeTheme.shapeRadius}
                                  shadowColor={activeTheme.shapeShadowColor}
                                  shadowBlur={activeTheme.shapeShadowBlur}
                                  shadowOffsetX={activeTheme.shapeShadowX}
                                  shadowOffsetY={activeTheme.shapeShadowY}
                                />
                                {ImageComponent && imageCache[block.src] ? (
                                  (() => {
                                    const img = imageCache[block.src]!;
                                    const layout = getCoverLayout(img, textWidth + 16, imageHeight);
                                    const alignX = block.align === "left" ? 0 : block.align === "right" ? textWidth + 16 - layout.width : layout.x;
                                    return (
                                      <ImageComponent
                                        image={img}
                                        x={safeArea.x + 24 + alignX}
                                        y={cursorY + layout.y}
                                        width={layout.width}
                                        height={layout.height}
                                      />
                                    );
                                  })()
                                ) : (
                                  <TextComponent
                                    x={safeArea.x + 24}
                                    y={cursorY + imageHeight / 2 - 10}
                                    width={textWidth + 16}
                                    align="center"
                                    text={imageCache[block.src] === null ? "Gagal memuat gambar" : "Memuat gambar..."}
                                    fill={activeTheme.accent}
                                    fontSize={18}
                                    fontFamily={activeTheme.fontBody}
                                  />
                                )}
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
                                  stroke="var(--color-primary-indigo, #5B3FFF)"
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
                                  fontFamily={activeTheme.fontBody}
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
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}