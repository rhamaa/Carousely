import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { ReactNode } from "react";
import Topbar from "./Topbar";

type MainLayoutProps = {
  sidebar: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  logPanel: ReactNode;
  // Topbar props
  isDesktopShell: boolean;
  lintIssueCount: number;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onExportPng: () => void;
  isExportingPng: boolean;
  onExportZip: () => void;
  isExportingZip: boolean;
};

export default function MainLayout({
  sidebar,
  editor,
  preview,
  logPanel,
  lintIssueCount,
  ...topbarProps
}: MainLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0B0D14] text-gray-300 font-body relative">
      {/* Ambient Mesh Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-coral/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <Topbar lintIssueCount={lintIssueCount} {...topbarProps} />
        
        <div className="flex-1 flex overflow-hidden">
          {sidebar}
          
          <div className="flex-1 flex overflow-hidden">
            <PanelGroup orientation="horizontal" className="h-full w-full">
              <Panel defaultSize={60} minSize={30} className="flex flex-col bg-white/5 backdrop-blur-xl border-x border-white/5 relative z-10">
                <PanelGroup orientation="vertical" className="h-full">
                  <Panel defaultSize={80} minSize={20} className="flex flex-col relative z-0">
                    {editor}
                  </Panel>
                  
                  <PanelResizeHandle className="h-1.5 w-full bg-transparent hover:bg-indigo/30 transition-colors cursor-row-resize flex items-center justify-center group relative z-20">
                    <div className="w-8 h-0.5 rounded-full bg-white/20 group-hover:bg-indigo transition-colors" />
                  </PanelResizeHandle>
                  
                  <Panel defaultSize={20} minSize={10} className="flex flex-col relative z-0">
                    {logPanel}
                  </Panel>
                </PanelGroup>
              </Panel>
              
              <PanelResizeHandle className="w-1.5 h-full bg-transparent hover:bg-indigo/30 transition-colors cursor-col-resize flex flex-col items-center justify-center group relative z-20">
                <div className="h-8 w-0.5 rounded-full bg-white/20 group-hover:bg-indigo transition-colors" />
              </PanelResizeHandle>
              
              <Panel defaultSize={40} minSize={20} className="flex flex-col bg-black/20 backdrop-blur-md relative z-0">
                {preview}
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>
    </div>
  );
}