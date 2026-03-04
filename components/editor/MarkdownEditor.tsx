import { quickSnippets, markdownHint } from "@/lib/constants";
import type { ChangeEvent, DragEvent, RefObject } from "react";

type MarkdownEditorProps = {
  markdown: string;
  setMarkdown: (value: string) => void;
  editorTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onDrop: (e: DragEvent<HTMLTextAreaElement>) => void;
  onDragOver: (e: DragEvent<HTMLTextAreaElement>) => void;
  onDragLeave: (e: DragEvent<HTMLTextAreaElement>) => void;
  lintIssueCount: number;
  lintSlideErrors: number;
  lintWarningCount: number;
};

export default function MarkdownEditor({
  markdown,
  setMarkdown,
  editorTextareaRef,
  onDrop,
  onDragOver,
  onDragLeave,
  lintIssueCount,
  lintSlideErrors,
  lintWarningCount,
}: MarkdownEditorProps) {
  const insertSnippet = (snippet: string) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const next = current.substring(0, start) + snippet + current.substring(end);
    setMarkdown(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] relative">
      <div className="flex-1 overflow-hidden relative">
        <textarea
          ref={editorTextareaRef}
          value={markdown}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMarkdown(e.target.value)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className="w-full h-full p-6 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar"
          placeholder={markdownHint}
          spellCheck={false}
        />
        <div className="absolute bottom-4 right-6 pointer-events-none opacity-20">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.5 4h-17A1.5 1.5 0 002 5.5v13A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0020.5 4zm-17 1h17v13h-17v-13zM5 7h4v2H5V7zm6 0h8v2h-8V7zm-6 4h14v2H5v-2zm0 4h14v2H5v-2z" />
          </svg>
        </div>
      </div>
      <div className="h-12 border-t border-gray-800 bg-[#252526] px-4 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          {quickSnippets.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => insertSnippet(snippet.content)}
              className="text-xs font-mono px-3 py-1.5 rounded bg-[#333333] hover:bg-[#444444] text-gray-300 transition-colors border border-gray-700"
              title={`Insert ${snippet.label}`}
            >
              +{snippet.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 font-mono">
            {markdown.split("\n").length} lines
          </div>
          <div
            className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${
              lintIssueCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {lintIssueCount > 0 ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {lintSlideErrors} errors, {lintWarningCount} warnings
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All Checks Passed
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}