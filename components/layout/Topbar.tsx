
type TopbarProps = {
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

export default function Topbar({
  isDesktopShell,
  lintIssueCount,
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

          <span className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono bg-white/5 border border-white/10 text-white/80">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: lintIssueCount > 0 ? "#f97316" : "#22c55e" }} />
            {lintIssueCount > 0 ? `${lintIssueCount} lint` : "Lint OK"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
