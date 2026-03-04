import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { ReactNode } from "react";
import Topbar from "./Topbar";
import type { AspectRatio, FontPreset, DesktopContext } from "@/lib/types";
import { themeStyles } from "@/lib/constants";

type MainLayoutProps = {
  sidebar: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  logPanel: ReactNode;
  // Topbar props
  activeAspectRatio: AspectRatio;
  setAspectRatio: (value: AspectRatio) => void;
  aspectRatioControlledByMarkdown: boolean;
  activeThemeKey: keyof typeof themeStyles;
  setSelectedTheme: (value: keyof typeof themeStyles) => void;
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
  onExportFolder: () => void;
  isExportingFolder: boolean;
};

export default function MainLayout({
  sidebar,
  editor,
  preview,
  logPanel,
  ...topbarProps
}: MainLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#1e1e1e] text-gray-300 font-sans">
      <Topbar {...topbarProps} />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebar}
        
        <div className="flex-1 flex overflow-hidden">
          <PanelGroup orientation="horizontal" className="h-full w-full">
            <Panel defaultSize={60} minSize={30} className="flex flex-col">
              <PanelGroup orientation="vertical" className="h-full">
                <Panel defaultSize={80} minSize={20} className="flex flex-col relative z-0">
                  {editor}
                </Panel>
                
                <PanelResizeHandle className="h-2 w-full bg-transparent hover:bg-cyan-500/50 transition-colors cursor-row-resize flex items-center justify-center group relative z-10">
                  <div className="w-8 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors" />
                </PanelResizeHandle>
                
                <Panel defaultSize={20} minSize={10} className="flex flex-col relative z-0">
                  {logPanel}
                </Panel>
              </PanelGroup>
            </Panel>
            
            <PanelResizeHandle className="w-2 h-full bg-transparent hover:bg-cyan-500/50 transition-colors cursor-col-resize flex flex-col items-center justify-center group relative z-10">
              <div className="h-8 w-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors" />
            </PanelResizeHandle>
            
            <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#1e1e1e] relative z-0 border-l border-gray-800">
              {preview}
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}