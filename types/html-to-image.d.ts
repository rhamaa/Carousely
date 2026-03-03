declare module "html-to-image" {
  type ToImageOptions = {
    filter?: (domNode: HTMLElement) => boolean;
    backgroundColor?: string;
    cacheBust?: boolean;
    pixelRatio?: number;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    canvasWidth?: number;
    canvasHeight?: number;
    skipAutoScale?: boolean;
  };

  export function toPng(node: HTMLElement, options?: ToImageOptions): Promise<string>;
}
