import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(
  new URL("../apps/worker/package.json", import.meta.url),
);
const ffmpeg = require("ffmpeg-static");
const assets = path.join(root, "demo-assets");
mkdirSync(assets, { recursive: true });
for (let i = 1; i <= 3; i++) {
  const original = path.join(
    assets,
    i === 1 ? "studio-demo.png" : `studio-demo-${i}.png`,
  );
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      original,
      "-vf",
      "scale=960:-2",
      "-q:v",
      "3",
      path.join(assets, `cover-${i}.jpg`),
    ],
    { windowsHide: true, stdio: "ignore" },
  );
}
const font =
  process.env.WATERMARK_FONT_PATH ||
  (process.platform === "win32"
    ? "C:/Windows/Fonts/arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const escapedFont = font
  .replaceAll("\\", "/")
  .replaceAll(":", "\\:")
  .replaceAll("'", "'\\''");
if (!existsSync(path.join(assets, "preview.mp4")))
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-loop",
      "1",
      "-i",
      path.join(assets, "cover-1.jpg"),
      "-t",
      "8",
      "-r",
      "24",
      "-vf",
      `scale=960:-2,drawtext=fontfile='${escapedFont}':text='ZENITH MEDIA DEMO':x=w-tw-24:y=h-th-24:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      path.join(assets, "preview.mp4"),
    ],
    { windowsHide: true, stdio: "pipe" },
  );
execFileSync(
  "python",
  [
    "-c",
    'import zipfile,sys,pathlib; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(p/"collection.zip","w",zipfile.ZIP_DEFLATED); z.write(p/"preview.mp4","sample.mp4"); z.writestr("README.txt","ZENITH MEDIA DEMO. Local testing only."); z.close()',
    assets,
  ],
  { windowsHide: true },
);
console.log("Local demonstration assets prepared from generated demo artwork.");
