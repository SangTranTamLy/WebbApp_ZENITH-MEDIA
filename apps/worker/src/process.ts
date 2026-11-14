import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import ffmpegBinary from "ffmpeg-static";
import ffprobeBinary from "ffprobe-static";
import type { PreviewJob } from "@zenith/shared";

export async function run(command: string, args: string[], cwd?: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: false,
    });
    let output = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Media process exceeded 30 minutes"));
    }, 30 * 60_000);
    child.stdout.on("data", (chunk) => {
      output = (output + String(chunk)).slice(-1_000_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + String(chunk)).slice(-4000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else
        reject(
          new Error(`Media process failed (${code}): ${stderr.slice(-500)}`),
        );
    });
  });
}
export async function sha256(file: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
export async function detectType(file: string) {
  const handle = await import("node:fs/promises").then((fs) =>
    fs.open(file, "r"),
  );
  const data = Buffer.alloc(512);
  const { bytesRead } = await handle.read(data, 0, data.length, 0);
  await handle.close();
  const head = data.subarray(0, bytesRead);
  if (
    head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (head[0] === 255 && head[1] === 216 && head[2] === 255)
    return "image/jpeg";
  if (
    head.toString("ascii", 0, 4) === "RIFF" &&
    head.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (head.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  if (
    !head.includes(0) &&
    !/[\u0001-\u0008\u000e-\u001f]/.test(head.toString("utf8"))
  )
    return "text/plain";
  return "application/octet-stream";
}
export async function renderPreview(
  input: string,
  directory: string,
  job: Pick<PreviewJob, "start" | "duration" | "watermark">,
) {
  const ffmpeg = process.env.FFMPEG_PATH || ffmpegBinary;
  if (!ffmpeg) throw new Error("FFmpeg executable unavailable");
  const probe = JSON.parse(
    await run(process.env.FFPROBE_PATH || ffprobeBinary.path, [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      input,
    ]),
  ) as {
    streams: {
      codec_type: string;
      width: number;
      height: number;
      avg_frame_rate: string;
    }[];
    format: { duration: string };
  };
  const video = probe.streams.find((s) => s.codec_type === "video");
  if (!video || job.start >= Number(probe.format.duration))
    throw new Error("No video stream or preview start exceeds source duration");
  const font =
    process.env.WATERMARK_FONT_PATH ||
    (process.platform === "win32"
      ? "C:/Windows/Fonts/arial.ttf"
      : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
  await copyFile(font, path.join(directory, "font.ttf"));
  await writeFile(path.join(directory, "watermark.txt"), job.watermark);
  const output = path.join(directory, "preview.mp4");
  const filter =
    "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,drawtext=fontfile=font.ttf:textfile=watermark.txt:expansion=none:x=w-tw-24:y=h-th-24:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=10";
  await run(
    ffmpeg,
    [
      "-y",
      "-ss",
      String(job.start),
      "-i",
      input,
      "-t",
      String(job.duration),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      filter,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-fps_mode",
      "passthrough",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      output,
    ],
    directory,
  );
  return { output, source: video };
}
