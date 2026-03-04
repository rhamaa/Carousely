"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { openProjectDialog, saveProject, saveProjectAsDialog } from './filesystem';

interface WorkspaceState {
  content: string;
  filePath: string | null;
  isDirty: boolean;
  isSaving: boolean;
  
  setContent: (content: string) => void;
  handleOpen: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleNew: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [content, setContentInternal] = useState<string>('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Autosave timer ref could be added here if needed

  const setContent = useCallback((newContent: string) => {
    setContentInternal(newContent);
    setIsDirty(true);
  }, []);

  const handleNew = useCallback(() => {
    if (isDirty) {
      const confirm = window.confirm("Ada perubahan yang belum disimpan. Yakin ingin membuat file baru?");
      if (!confirm) return;
    }
    setContentInternal('');
    setFilePath(null);
    setIsDirty(false);
  }, [isDirty]);

  const handleOpen = useCallback(async () => {
    if (isDirty) {
      const confirm = window.confirm("Ada perubahan yang belum disimpan. Yakin ingin membuka file lain?");
      if (!confirm) return;
    }

    try {
      const result = await openProjectDialog();
      if (result) {
        setContentInternal(result.content);
        setFilePath(result.path);
        setIsDirty(false);
      }
    } catch (error) {
      alert("Gagal membuka file");
    }
  }, [isDirty]);

  const handleSave = useCallback(async () => {
    if (!isDirty && filePath) return;

    setIsSaving(true);
    try {
      if (filePath) {
        await saveProject(filePath, content);
        setIsDirty(false);
      } else {
        await handleSaveAs();
      }
    } catch (error) {
      alert("Gagal menyimpan file");
    } finally {
      setIsSaving(false);
    }
  }, [content, filePath, isDirty]);

  const handleSaveAs = useCallback(async () => {
    setIsSaving(true);
    try {
      const newPath = await saveProjectAsDialog(content);
      if (newPath) {
        setFilePath(newPath);
        setIsDirty(false);
      }
    } catch (error) {
      alert("Gagal melakukan Save As");
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  // Keyboard Shortcuts (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <WorkspaceContext.Provider
      value={{
        content,
        filePath,
        isDirty,
        isSaving,
        setContent,
        handleOpen,
        handleSave,
        handleSaveAs,
        handleNew
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
