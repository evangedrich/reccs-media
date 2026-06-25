// Minimal ambient declaration for `subset-font` (ships no types).
declare module "subset-font" {
  interface SubsetFontOptions {
    targetFormat?: "sfnt" | "woff" | "woff2";
    preserveNameIds?: number[];
    variationAxes?: Record<string, number | { min?: number; max?: number; default?: number }>;
    noLayoutClosure?: boolean;
  }
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Buffer>;
}
