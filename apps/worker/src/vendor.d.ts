declare module "ffprobe-static" {
  const binary: { path: string };
  export default binary;
}
declare module "buffer-crc32" {
  export default function crc32(input: Buffer, previous?: Buffer): Buffer;
}
