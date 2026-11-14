import yauzl from "yauzl";
import crc32 from "buffer-crc32";
import type { AssetFile } from "@zenith/shared";

export async function validateZip(
  filename: string,
): Promise<NonNullable<AssetFile["zip"]>> {
  const errors: string[] = [],
    warnings: string[] = [],
    entries: string[] = [];
  const archive = await new Promise<yauzl.ZipFile>((resolve, reject) =>
    yauzl.open(
      filename,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (e, z) => (e || !z ? reject(e) : resolve(z)),
    ),
  );
  let expanded = 0;
  const seen = new Set<string>();
  await new Promise<void>((resolve) => {
    let ended = false;
    const fail = (message: string) => {
      if (ended) return;
      ended = true;
      errors.push(message);
      archive.close();
      resolve();
    };
    archive.on("error", (e) => fail(e.message));
    archive.on("end", () => {
      ended = true;
      resolve();
    });
    archive.on("entry", (entry: yauzl.Entry) => {
      const name = entry.fileName;
      if (entries.length >= 10000) return fail("Too many ZIP entries");
      if (
        name.startsWith("/") ||
        /^[a-z]:/i.test(name) ||
        name.split("/").some((p) => p === "..") ||
        /[\\\u0000-\u001f]/.test(name)
      )
        return fail(`Unsafe path: ${name}`);
      if (((entry.externalFileAttributes >>> 16) & 0o170000) === 0o120000)
        return fail(`Symlink is forbidden: ${name}`);
      if (entry.generalPurposeBitFlag & 1)
        return fail(`Encrypted entry: ${name}`);
      if (seen.has(name.toLowerCase())) return fail(`Duplicate path: ${name}`);
      seen.add(name.toLowerCase());
      expanded += entry.uncompressedSize;
      if (
        expanded > 30_000_000_000 ||
        (entry.uncompressedSize > 100_000_000 &&
          entry.uncompressedSize / Math.max(entry.compressedSize, 1) > 200)
      )
        return fail("Unsafe ZIP expansion ratio or total size");
      if (
        /(^|\/)(__MACOSX|\.DS_Store)(\/|$)/.test(name) &&
        warnings.length < 100
      )
        warnings.push(`Metadata entry: ${name}`);
      if (name.endsWith("/")) {
        archive.readEntry();
        return;
      }
      entries.push(name);
      archive.openReadStream(entry, (error, stream) => {
        if (error || !stream)
          return fail(error?.message ?? "Unreadable ZIP entry");
        let checksum: Buffer | undefined;
        stream.on("data", (chunk: Buffer) => {
          checksum = crc32(chunk, checksum);
        });
        stream.on("error", (e) => fail(e.message));
        stream.on("end", () => {
          const value = checksum?.readUInt32BE(0) ?? 0;
          if (value !== entry.crc32) return fail(`CRC mismatch: ${name}`);
          if (!ended) archive.readEntry();
        });
      });
    });
    archive.readEntry();
  });
  if (!entries.length) errors.push("ZIP contains no files");
  return {
    status: errors.length ? "invalid" : "valid",
    errors,
    warnings,
    entries,
    acknowledgedBy: null,
  };
}
