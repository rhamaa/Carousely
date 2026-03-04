import type { LogEntry } from "@/lib/types";
import { useEffect, useRef } from "react";

type LogPanelProps = {
  logs: LogEntry[];
  onClear: () => void;
};

export default function LogPanel({ logs, onClear }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-48 border-t border-gray-800 bg-[#0f111a] flex flex-col font-mono text-sm shadow-inner shrink-0">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#151822] border-b border-gray-800/50 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold tracking-wide text-xs">TERMINAL</span>
          <span className="text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800/50">
            {logs.length} events
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-800/50"
          title="Clear Logs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scroll-smooth">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic px-2 py-1 select-none flex items-center gap-2 h-full justify-center">
            <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ready and waiting for actions...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="px-2 py-1 rounded hover:bg-white/5 transition-colors group flex items-start gap-3 border border-transparent hover:border-white/5"
            >
              <span className="text-gray-500 shrink-0 text-[11px] mt-0.5 min-w-[70px] font-medium tabular-nums">
                {log.timestamp}
              </span>

              <span className="shrink-0 mt-0.5">
                {log.level === "info" && (
                  <span className="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    INFO
                  </span>
                )}
                {log.level === "success" && (
                  <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    DONE
                  </span>
                )}
                {log.level === "error" && (
                  <span className="text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    FAIL
                  </span>
                )}
              </span>

              <span
                className={`flex-1 break-words leading-relaxed ${
                  log.level === "error"
                    ? "text-rose-300"
                    : log.level === "success"
                      ? "text-emerald-300"
                      : "text-gray-300"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}