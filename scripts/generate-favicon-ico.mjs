// Generates a multi-size src/app/favicon.ico from the 512x512 logo (public/favicon.png).
// The ICO container embeds PNG-encoded entries (valid on all modern browsers / Vista+).
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = path.resolve("public/favicon.png");
const OUT = path.resolve("src/app/favicon.ico");
const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  const sourceBuffer = await readFile(SOURCE);

  // Render each size as a PNG buffer (preserving transparency).
  const pngs = await Promise.all(
    SIZES.map(async (size) => {
      const buf = await sharp(sourceBuffer)
        .resize(size, size, { fit: "cover", position: "center" })
        .png()
        .toBuffer();
      return { size, buf };
    })
  );

  const count = pngs.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * count;

  // Compute offsets.
  let offset = dirSize;
  const entries = pngs.map(({ size, buf }) => {
    const entry = { size, buf, offset };
    offset += buf.length;
    return entry;
  });

  const total = offset;
  const out = Buffer.alloc(total);

  // ICONDIR
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type: 1 = icon
  out.writeUInt16LE(count, 4); // image count

  // ICONDIRENTRY[]
  entries.forEach((e, i) => {
    const base = headerSize + i * entrySize;
    out.writeUInt8(e.size >= 256 ? 0 : e.size, base + 0); // width (0 => 256)
    out.writeUInt8(e.size >= 256 ? 0 : e.size, base + 1); // height (0 => 256)
    out.writeUInt8(0, base + 2); // color count (0 for >= 8bpp)
    out.writeUInt8(0, base + 3); // reserved
    out.writeUInt16LE(1, base + 4); // color planes
    out.writeUInt16LE(32, base + 6); // bits per pixel
    out.writeUInt32LE(e.buf.length, base + 8); // bytes in resource
    out.writeUInt32LE(e.offset, base + 12); // offset to image data
  });

  // Image data
  entries.forEach((e) => {
    e.buf.copy(out, e.offset);
  });

  await writeFile(OUT, out);
  console.log(`Wrote ${OUT} (${out.length} bytes, ${count} sizes: ${SIZES.join(", ")}px)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});