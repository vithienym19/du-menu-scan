#!/usr/bin/env node
// BE-13 — printable QR codes per cafeteria (product/user-flows.md Flow 8).
//
// Usage:
//   npm run qr -- --domain menu.example.org \
//     --cafeteria "main-hall=학생회관 식당" --cafeteria dorm [--out qr-out] [--font /path/font.ttf]
//
// Writes <out>/<code>.png (QR only) and <out>/<code>.pdf (A5 poster with a
// four-language instruction) for every cafeteria. The QR encodes
// https://<domain>/r/<code> — never a hosting-provider URL.
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import PDFDocument from "pdfkit";
import { INSTRUCTIONS, entryUrl, parseCafeterias, qrPng, validateDomain } from "./qr-lib.mjs";

// The poster mixes Korean, Chinese and Vietnamese, so it needs one font that
// covers all three. First match wins; override with --font or QR_FONT.
const FONT_CANDIDATES = [
  { path: "/System/Library/Fonts/Supplemental/Arial Unicode.ttf" },
  { path: "/Library/Fonts/Arial Unicode.ttf" },
  {
    path: "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    family: "NotoSansCJKkr-Regular",
  },
  { path: "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc", family: "NotoSansCJKkr-Regular" },
];

function findFont(explicit) {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`Font not found: ${explicit}`);
    return { path: explicit };
  }
  const found = FONT_CANDIDATES.find((f) => existsSync(f.path));
  if (!found) {
    throw new Error(
      "No font covering Korean, Chinese and Vietnamese found. Install Noto Sans CJK or pass --font <file.ttf|.otf>.",
    );
  }
  return found;
}

// A5 portrait in PDF points.
const A5 = { width: 419.53, height: 595.28 };

export async function writePoster({ url, name, code, png, font, file }) {
  const doc = new PDFDocument({
    size: [A5.width, A5.height],
    margin: 36,
    info: { Title: `DU-Menu Scan — ${name ?? code}`, Subject: url },
  });
  const done = new Promise((res, rej) => {
    const stream = createWriteStream(file);
    stream.on("finish", res);
    stream.on("error", rej);
    doc.pipe(stream);
  });
  if (font.family) doc.registerFont("poster", font.path, font.family);
  else doc.registerFont("poster", font.path);
  doc.font("poster");

  const inner = A5.width - 72;
  doc
    .fontSize(22)
    .fillColor("#111111")
    .text("DU-Menu Scan", 36, 40, { width: inner, align: "center" });
  if (name) doc.fontSize(14).fillColor("#444444").text(name, { width: inner, align: "center" });

  const qrSize = 250;
  const qrTop = 118;
  doc.image(png, (A5.width - qrSize) / 2, qrTop, { width: qrSize, height: qrSize });

  let y = qrTop + qrSize + 22;
  for (const { text } of INSTRUCTIONS) {
    doc.fontSize(12).fillColor("#111111").text(text, 36, y, { width: inner, align: "center" });
    y = doc.y + 8;
  }
  doc
    .fontSize(9)
    .fillColor("#555555")
    .text(url, 36, A5.height - 54, { width: inner, align: "center" });
  doc.end();
  await done;
}

async function main() {
  const { values } = parseArgs({
    options: {
      domain: { type: "string" },
      cafeteria: { type: "string", multiple: true },
      out: { type: "string", default: "qr-out" },
      font: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(
      'Usage: npm run qr -- --domain <team domain> --cafeteria "<code>[=<name>]" [...] [--out dir] [--font file]',
    );
    return;
  }
  const domain = validateDomain(values.domain);
  const cafeterias = parseCafeterias(values.cafeteria);
  const font = findFont(values.font ?? process.env.QR_FONT);
  const out = resolve(values.out);
  mkdirSync(out, { recursive: true });

  for (const { code, name } of cafeterias) {
    const url = entryUrl(domain, code);
    const png = await qrPng(url);
    const pngFile = join(out, `${code}.png`);
    const pdfFile = join(out, `${code}.pdf`);
    await writeFile(pngFile, png);
    await writePoster({ url, name, code, png, font, file: pdfFile });
    console.log(`${code}: ${url} → ${pngFile}, ${pdfFile}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`error: ${err.message}`);
    process.exit(1);
  });
}
