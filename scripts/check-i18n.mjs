import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "src", "i18n");
const languages = ["en", "ko", "vi", "zh"];
const placeholder = /\{\{\s*(\w+)\s*\}\}/g;

function flatten(obj, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, out);
    else out.set(path, String(value));
  }
  return out;
}

const files = Object.fromEntries(
  languages.map((lang) => [
    lang,
    flatten(JSON.parse(readFileSync(join(dir, `${lang}.json`), "utf8"))),
  ]),
);

const source = files.en;
const errors = [];

for (const lang of languages.filter((l) => l !== "en")) {
  const target = files[lang];
  for (const key of source.keys()) {
    if (!target.has(key)) {
      errors.push(`${lang}: missing key ${key}`);
      continue;
    }
    const want = [...source.get(key).matchAll(placeholder)]
      .map((m) => m[1])
      .sort()
      .join(",");
    const got = [...target.get(key).matchAll(placeholder)]
      .map((m) => m[1])
      .sort()
      .join(",");
    if (want !== got)
      errors.push(
        `${lang}: placeholders differ in ${key} (en: ${want || "none"}, ${lang}: ${got || "none"})`,
      );
    if (target.get(key).trim() === "") errors.push(`${lang}: empty value for ${key}`);
  }
  for (const key of target.keys()) {
    if (!source.has(key)) errors.push(`${lang}: extra key ${key}`);
  }
}

if (errors.length) {
  console.error(`i18n check failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`i18n check passed: ${source.size} keys × ${languages.length} languages`);
