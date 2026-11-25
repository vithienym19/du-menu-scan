// Pure helpers for the QR code generator (BE-13). No file or network access here.
import QRCode from "qrcode";

// Printed QR codes must point to the team's own domain, never to a hosting
// provider (product/technical-architecture.md §2.2), so hosting can change
// without reprinting.
const HOSTING_SUFFIXES = [
  "vercel.app",
  "pages.dev",
  "workers.dev",
  "netlify.app",
  "railway.app",
  "onrender.com",
  "herokuapp.com",
  "fly.dev",
  "github.io",
  "gitlab.io",
  "supabase.co",
  "web.app",
  "firebaseapp.com",
  "azurewebsites.net",
  "azurestaticapps.net",
  "cloudfront.net",
  "amplifyapp.com",
  "appspot.com",
  "run.app",
  "ngrok.io",
  "ngrok-free.app",
  "trycloudflare.com",
  "directus.app",
];

const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Short instruction printed under the QR code. Four languages (ko, en, vi, zh). */
export const INSTRUCTIONS = [
  { lang: "ko", text: "QR을 스캔하면 오늘의 메뉴를 내 언어로 볼 수 있어요" },
  { lang: "en", text: "Scan to see today's menu in your language" },
  { lang: "vi", text: "Quét mã để xem thực đơn hôm nay bằng ngôn ngữ của bạn" },
  { lang: "zh", text: "扫码用你的语言查看今日菜单" },
];

/**
 * Validates the team domain and returns the bare host name.
 * Throws for hosting-provider hosts, IPs, localhost, paths or non-https URLs.
 */
export function validateDomain(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Missing --domain (the team's own domain, e.g. menu.example.org)");
  }
  const raw = input.trim().toLowerCase();
  const withScheme = raw.includes("://") ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`Invalid domain: ${input}`);
  }
  if (url.protocol !== "https:") throw new Error("The domain must use https");
  if (url.pathname !== "/" || url.search || url.hash || url.port || url.username) {
    throw new Error("Give only the host name, without path, port or query");
  }
  const host = url.hostname;
  if (host === "localhost" || /^[\d.]+$/.test(host) || host.startsWith("[")) {
    throw new Error("QR codes must point to the team domain, not localhost or an IP address");
  }
  if (!host.includes(".")) throw new Error(`Invalid domain: ${input}`);
  const provider = HOSTING_SUFFIXES.find((s) => host === s || host.endsWith(`.${s}`));
  if (provider) {
    throw new Error(
      `${host} is a hosting-provider URL (${provider}). Use the team's own domain so QR codes survive a hosting change.`,
    );
  }
  return host;
}

/** Validates a cafeteria code (lowercase letters, digits and single hyphens). */
export function validateCode(code) {
  if (typeof code !== "string" || !CODE_PATTERN.test(code)) {
    throw new Error(`Invalid cafeteria code: ${JSON.stringify(code)} (use e.g. main-hall)`);
  }
  return code;
}

/** The URL encoded in the QR code: https://<domain>/r/<code> (route of S1). */
export function entryUrl(domain, code) {
  return `https://${validateDomain(domain)}/r/${validateCode(code)}`;
}

/**
 * Parses `--cafeteria code[=Display name]` values into { code, name } objects.
 * Duplicate codes are rejected.
 */
export function parseCafeterias(values) {
  if (!values || values.length === 0) {
    throw new Error(
      'Give at least one --cafeteria code (e.g. --cafeteria "main-hall=학생회관 식당")',
    );
  }
  const seen = new Set();
  return values.map((value) => {
    const eq = value.indexOf("=");
    const code = validateCode(eq === -1 ? value.trim() : value.slice(0, eq).trim());
    const name = eq === -1 ? null : value.slice(eq + 1).trim() || null;
    if (seen.has(code)) throw new Error(`Duplicate cafeteria code: ${code}`);
    seen.add(code);
    return { code, name };
  });
}

/** PNG buffer of the QR code. Error correction "Q" survives scratches and stains on a printed sheet. */
export function qrPng(url, width = 1024) {
  return QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "Q", margin: 4, width });
}
