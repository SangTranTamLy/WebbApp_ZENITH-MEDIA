import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(
  new URL("../apps/worker/package.json", import.meta.url),
);
const ffmpeg = require("ffmpeg-static"),
  ffprobe = require("ffprobe-static").path;
const assets = path.join(root, "demo-assets");
const originals = [
  "studio-demo.png",
  "studio-demo-2.png",
  "studio-demo-3.png",
  "kinetic-type.png",
  "motion-collection.png",
  "violet-iris.png",
];
const font = (
  process.env.WATERMARK_FONT_PATH ||
  (process.platform === "win32"
    ? "C:/Windows/Fonts/arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
)
  .replaceAll("\\", "/")
  .replaceAll(":", "\\:");
const run = (args) =>
  execFileSync(ffmpeg, args, { windowsHide: true, stdio: "pipe" });
const manifest = [];
for (const [i, original] of originals.entries()) {
  const source = path.join(assets, original);
  const info = JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-of", "json", source],
      { windowsHide: true },
    ).toString(),
  ).streams[0];
  const width = Math.round((540 * info.width) / info.height / 2) * 2;
  const cover = `studio-cover-${i + 1}.webp`,
    preview = `studio-preview-${i + 1}.mp4`;
  if (!existsSync(path.join(assets, cover)))
    run([
      "-y",
      "-i",
      source,
      "-vf",
      "scale=1280:-2",
      "-quality",
      "86",
      path.join(assets, cover),
    ]);
  if (!existsSync(path.join(assets, preview)))
    run([
      "-y",
      "-i",
      source,
      "-vf",
      `zoompan=z='min(zoom+0.00018,1.035)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=192:s=${width}x540:fps=24,drawtext=fontfile='${font}':text='ZENITH MEDIA DEMO':x=w-tw-18:y=h-th-18:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.4`,
      "-frames:v",
      "192",
      "-c:v",
      "libx264",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      path.join(assets, preview),
    ]);
  manifest.push({
    index: i + 1,
    cover,
    preview,
    width,
    height: 540,
    fps: 24,
    duration: 8,
  });
  console.log(`Prepared ${original}: ${width}x540, 24 fps, 8 seconds.`);
}
writeFileSync(
  path.join(assets, "studio-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
// A higher-resolution demo option is a distinct file, not a renamed entitlement.
if (!existsSync(path.join(assets, "aurora-720.mp4")))
  run([
    "-y",
    "-loop",
    "1",
    "-i",
    path.join(assets, originals[0]),
    "-t",
    "8",
    "-r",
    "24",
    "-vf",
    `scale=-2:720,drawtext=fontfile='${font}':text='ZENITH MEDIA DEMO':x=w-tw-20:y=h-th-20:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.4`,
    "-c:v",
    "libx264",
    "-crf",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    path.join(assets, "aurora-720.mp4"),
  ]);
// Keep the original collection.zip and preview.mp4 intact for existing demo orders.
execFileSync(
  "python",
  [
    "-c",
    'import zipfile,sys,pathlib; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(p/"studio-collection.zip","w",zipfile.ZIP_DEFLATED); z.write(p/"preview.mp4","sample.mp4"); z.write(p/"studio-preview-2.mp4","blue-hour.mp4"); z.writestr("README.txt","ZENITH MEDIA DEMO. Generated artwork with camera movement for local testing. Not commercial Flowframes/Twixtor footage."); z.close()',
    assets,
  ],
  { windowsHide: true },
);
