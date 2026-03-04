export const estimateTextHeight = (text: string, width: number, fontSize: number, lineHeight = 1.45): number => {
  const averageCharWidth = fontSize * 0.5;
  const charsPerLine = Math.max(10, Math.floor(width / averageCharWidth));
  const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lineCount * fontSize * lineHeight;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const resolveFontFamily = (cssVar: string, fallback: string): string => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
};

export const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const parts = dataUrl.split(",", 2);
  if (parts.length !== 2) {
    throw new Error("Data URL tidak valid.");
  }

  const binaryString = atob(parts[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes;
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Gagal membaca gambar drop."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Gagal membaca file."));
    };
    reader.readAsDataURL(file);
  });
};
