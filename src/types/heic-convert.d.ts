declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer;
    format: "PNG" | "JPEG";
    quality?: number;
  }

  function heicConvert(options: HeicConvertOptions): Promise<Buffer>;

  export default heicConvert;
}
