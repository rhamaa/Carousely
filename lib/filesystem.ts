import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export interface FileData {
  path: string;
  content: string;
}

const FILE_FILTERS = [
  {
    name: 'Carousely Project',
    extensions: ['carousely', 'md'],
  },
];

/**
 * Membuka dialog untuk memilih file, lalu membaca isinya menggunakan backend Tauri.
 */
export async function openProjectDialog(): Promise<FileData | null> {
  try {
    const selectedPath = await open({
      multiple: false,
      filters: FILE_FILTERS,
    });

    if (!selectedPath) {
      return null; // User membatalkan dialog
    }

    const pathStr = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
    
    const content = await invoke<string>('open_project_file', { path: pathStr });
    
    return {
      path: pathStr,
      content,
    };
  } catch (error) {
    console.error('Gagal membuka file:', error);
    throw error;
  }
}

/**
 * Menyimpan konten ke path yang sudah ada (Save).
 */
export async function saveProject(path: string, content: string): Promise<void> {
  try {
    await invoke('save_project_file', { path, content });
  } catch (error) {
    console.error('Gagal menyimpan file:', error);
    throw error;
  }
}

/**
 * Membuka dialog Save As, lalu menyimpan konten ke path baru.
 */
export async function saveProjectAsDialog(content: string): Promise<string | null> {
  try {
    const selectedPath = await save({
      filters: FILE_FILTERS,
      defaultPath: 'untitled-project.carousely',
    });

    if (!selectedPath) {
      return null; // User membatalkan dialog
    }

    await saveProject(selectedPath, content);
    return selectedPath;
  } catch (error) {
    console.error('Gagal melakukan Save As:', error);
    throw error;
  }
}
