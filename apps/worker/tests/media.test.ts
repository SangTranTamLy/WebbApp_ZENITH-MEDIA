import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import { validateZip } from "../src/zip.js";
import { renderPreview, run, sha256, detectType } from "../src/process.js";

test("real FFmpeg preserves frame rate and aspect ratio, limits resolution and adds watermark", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "zenith-worker-test-"));
  try {
    const source = path.join(dir, "input.mp4");
    await run(ffmpeg!, [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=1920x1080:rate=60",
      "-t",
      "2",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      source,
    ]);
    const originalHash = await sha256(source);
    const { output } = await renderPreview(source, dir, {
      start: 0.25,
      duration: 1,
      watermark: "ZENITH MEDIA TEST",
    });
    const result = JSON.parse(
      await run(ffprobe.path, [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        output,
      ]),
    );
    const video = result.streams.find(
      (s: { codec_type: string }) => s.codec_type === "video",
    );
    assert.equal(video.width, 1280);
    assert.equal(video.height, 720);
    assert.equal(video.avg_frame_rate, "60/1");
    assert(Math.abs(Number(result.format.duration) - 1) < 0.1);
    assert.equal(await sha256(source), originalHash);
    assert.notEqual(await sha256(output), originalHash);
    await assert.rejects(
      renderPreview(source, dir, { start: 10, duration: 1, watermark: "TEST" }),
      /exceeds source/,
    );
  } finally {
    if (path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep))
      await rm(dir, { recursive: true, force: true });
  }
});

test("ZIP validation rejects traversal, corrupt CRC and missing payload; warns about metadata", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "zenith-zip-test-"));
  try {
    const script = `import zipfile,pathlib,sys\np=pathlib.Path(sys.argv[1])\nfor name,entries in {'valid.zip':{'video.mp4':'video','README.txt':'readme'},'traversal.zip':{'../escape.txt':'bad'},'warning.zip':{'video.mp4':'video','__MACOSX/junk':'metadata'},'empty.zip':{}}.items():\n with zipfile.ZipFile(p/name,'w',zipfile.ZIP_STORED) as z:\n  for k,v in entries.items():z.writestr(k,v)\n`;
    execFileSync("python", ["-c", script, dir], { windowsHide: true });
    assert.equal(
      (await validateZip(path.join(dir, "valid.zip"))).status,
      "valid",
    );
    assert.equal(
      (await validateZip(path.join(dir, "traversal.zip"))).status,
      "invalid",
    );
    assert.equal(
      (await validateZip(path.join(dir, "warning.zip"))).warnings.length,
      1,
    );
    assert.equal(
      (await validateZip(path.join(dir, "empty.zip"))).status,
      "invalid",
    );
    const corrupt = await readFile(path.join(dir, "valid.zip"));
    const idx = 30 + corrupt.readUInt16LE(26) + corrupt.readUInt16LE(28);
    corrupt[idx + 1] = 0;
    await writeFile(path.join(dir, "corrupt.zip"), corrupt);
    assert.equal(
      (await validateZip(path.join(dir, "corrupt.zip"))).status,
      "invalid",
    );
    const file = path.join(dir, "image.txt");
    await writeFile(file, Buffer.from([0, 1, 2, 3]));
    assert.equal(await detectType(file), "application/octet-stream");
  } finally {
    if (path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep))
      await rm(dir, { recursive: true, force: true });
  }
});
