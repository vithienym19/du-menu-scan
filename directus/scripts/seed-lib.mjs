// Shared helpers for the reference-data seed: tiny CSV parser and seed loaders.
// Used by import-seed.mjs and directus/seed/seed.test.ts. No dependencies.

import { readFileSync } from "node:fs";

export const SEED_DIR = new URL("../seed/", import.meta.url);

/**
 * Parses CSV text (RFC 4180 subset): comma separator, double-quoted fields with "" escapes,
 * quoted fields may contain commas/newlines. Lines starting with # (outside quotes) are comments.
 * Returns objects keyed by the header row. Throws on ragged rows.
 */
export function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let atLineStart = true;
  let skipComment = false;
  const text = input.replace(/^﻿/, "");
  const endRow = () => {
    row.push(field);
    field = "";
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
    atLineStart = true;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (skipComment) {
      if (ch === "\n") {
        skipComment = false;
        atLineStart = true;
      }
      continue;
    }
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (atLineStart && ch === "#") {
      skipComment = true;
      continue;
    }
    atLineStart = false;
    if (ch === '"' && field === "") inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") endRow();
    else if (ch !== "\r") field += ch;
  }
  if (inQuotes) throw new Error("CSV: unterminated quoted field");
  if (field !== "" || row.length > 0) endRow();
  const [header, ...body] = rows;
  if (!header) throw new Error("CSV: missing header row");
  return body.map((cells, idx) => {
    if (cells.length !== header.length) {
      throw new Error(`CSV: row ${idx + 1} has ${cells.length} cells, expected ${header.length}`);
    }
    return Object.fromEntries(header.map((h, i) => [h.trim(), cells[i]]));
  });
}

function readCsv(name) {
  return parseCsv(readFileSync(new URL(name, SEED_DIR), "utf8"));
}

function parseNames(raw, where) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(`${where}: names is not valid JSON`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${where}: names must be a JSON object`);
  }
  return value;
}

export function loadAllergens() {
  return readCsv("allergens.csv").map((r) => ({
    code: r.code.trim(),
    name_ko: r.name_ko.trim(),
    names: parseNames(r.names, `allergen ${r.code}`),
  }));
}

export function loadDietTags() {
  return readCsv("diet_tags.csv").map((r) => ({ code: r.code.trim() }));
}

export function loadIngredients() {
  return readCsv("ingredients.csv").map((r) => ({
    name_ko: r.name_ko.trim(),
    names: parseNames(r.names, `ingredient ${r.name_ko}`),
    diet_tags: r.diet_tags
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}
