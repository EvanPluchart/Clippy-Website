import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = [
  { file: "index.html", lang: "fr", canonical: "https://clippy.evanpluchart.fr/" },
  { file: "en.html", lang: "en", canonical: "https://clippy.evanpluchart.fr/en" },
  { file: "404.html", lang: "fr" },
];
const errors = [];

const fail = (file, message) => errors.push(`${file}: ${message}`);
const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1], match[2] ?? match[3] ?? ""]),
);

for (const page of pages) {
  const html = readFileSync(join(root, page.file), "utf8");
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || "";
  const htmlAttributes = attributes(htmlTag);

  if (htmlAttributes.lang !== page.lang) fail(page.file, `expected lang="${page.lang}"`);
  if (!/<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1">/i.test(html)) {
    fail(page.file, "missing responsive viewport");
  }
  if (!/<title>[^<]{8,}<\/title>/i.test(html)) fail(page.file, "missing useful title");
  if (!/<main\b/i.test(html) || !/<h1\b/i.test(html)) fail(page.file, "missing main or h1");

  if (page.canonical) {
    if (!html.includes(`rel="canonical" href="${page.canonical}"`)) fail(page.file, "incorrect canonical URL");
    for (const language of ["fr", "en", "x-default"]) {
      if (!html.includes(`hreflang="${language}"`)) fail(page.file, `missing ${language} hreflang`);
    }
    if (!/<meta\s+name="description"\s+content="[^"]{50,}"/i.test(html)) {
      fail(page.file, "missing useful meta description");
    }
    if (!html.includes("copy-icon-default") || !html.includes("copy-icon-success")) {
      fail(page.file, "missing Homebrew copy and success icons");
    }
    if (html.includes('data-copy-icon aria-hidden="true">□</span>')) {
      fail(page.file, "contains the placeholder Homebrew copy icon");
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const imageAttributes = attributes(match[0]);
    if (!("alt" in imageAttributes)) fail(page.file, `image missing alt: ${match[0].slice(0, 80)}`);
    if (!imageAttributes.src) {
      fail(page.file, "image missing src");
      continue;
    }
    if (imageAttributes.src.startsWith("/")) {
      const imagePath = join(root, imageAttributes.src.slice(1));
      if (!existsSync(imagePath)) fail(page.file, `missing image ${imageAttributes.src}`);
    }
  }

  for (const match of html.matchAll(/<(?:a|link|script)\b[^>]*(?:href|src)="([^"]+)"/gi)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|#|data:)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean.startsWith("/")) continue;
    const direct = resolve(root, `.${clean}`);
    const candidates = [direct];
    if (!extname(clean)) candidates.push(`${direct}.html`, join(direct, "index.html"));
    if (!candidates.some(existsSync)) fail(page.file, `broken local reference ${reference}`);
  }

  if (/\b(?:TODO|FIXME|lorem ipsum|example\.com)\b/i.test(html)) {
    fail(page.file, "contains placeholder text");
  }
}

for (const asset of [
  "assets/app-icon.png",
  "assets/apple-touch-icon.png",
  "assets/favicon.png",
  "assets/history-en.jpg",
  "assets/history-fr.jpg",
  "assets/quick-panel-en.jpg",
  "assets/quick-panel-fr.jpg",
  "assets/settings-en.jpg",
  "assets/settings-fr.jpg",
  "assets/site.js",
  "assets/styles.css",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
  "vercel.json",
]) {
  const path = join(root, asset);
  if (!existsSync(path)) {
    fail("project", `missing ${asset}`);
  } else if (statSync(path).size === 0) {
    fail("project", `empty ${asset}`);
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${pages.length} pages and all required assets.`);
}
