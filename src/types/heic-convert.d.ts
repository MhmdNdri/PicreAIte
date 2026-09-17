declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer;
    format: "PNG" | "JPEG";
    quality?: number;
  }

  function heicConvert(options: HeicConvertOptions): Promise<Buffer>;

  export default heicConvert;
}

declare module "heic-convert/browser" {
  interface HeicConvertOptions {
    buffer: Uint8Array;
    format: "PNG" | "JPEG";
    quality?: number;
  }

  function heicConvert(options: HeicConvertOptions): Promise<Uint8Array>;

  export default heicConvert;
}
