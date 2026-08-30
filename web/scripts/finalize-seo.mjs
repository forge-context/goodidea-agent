// Absolute URLs can only be written once the production host is known, so they are
// applied to the build rather than kept in the source HTML. Changing host is one
// environment variable, not an edit across four files.
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");

const siteUrl = (process.env.SITE_URL ?? "https://goodidea.jianguoding.com").replace(/\/$/, "");

// The root page serves the English copy. It points at /en/ so the two are not
// indexed as competing duplicates.
const pages = [
  { file: "index.html", path: "/", canonical: "/en/" },
  { file: "en/index.html", path: "/en/", canonical: "/en/" },
  { file: "ja/index.html", path: "/ja/", canonical: "/ja/" },
  { file: "zh-cn/index.html", path: "/zh-cn/", canonical: "/zh-cn/" },
];

const alternates = [
  { hreflang: "en", path: "/en/" },
  { hreflang: "ja", path: "/ja/" },
  { hreflang: "zh-CN", path: "/zh-cn/" },
  { hreflang: "x-default", path: "/en/" },
];

const absolute = (path) => `${siteUrl}${path}`;

for (const page of pages) {
  const target = join(dist, page.file);
  let html = await readFile(target, "utf8");

  // Relative hreflang values are ignored by search engines, so each one is rewritten
  // to the full URL rather than left as a path.
  for (const alternate of alternates) {
    html = html.replace(
      new RegExp(`(<link rel="alternate" hreflang="${alternate.hreflang}" href=")[^"]*(")`),
      `$1${absolute(alternate.path)}$2`,
    );
  }

  const head = [
    `<link rel="canonical" href="${absolute(page.canonical)}" />`,
    `<meta property="og:url" content="${absolute(page.path)}" />`,
  ].join("\n    ");
  html = html.replace("</head>", `  ${head}\n  </head>`);

  await writeFile(target, html, "utf8");
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...alternates
    .filter((alternate) => alternate.hreflang !== "x-default")
    .map((alternate) =>
      [
        "  <url>",
        `    <loc>${absolute(alternate.path)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        // Every language declares the whole set, which is how a search engine learns
        // these are one page in three languages rather than three pages.
        ...alternates.map(
          (other) =>
            `    <xhtml:link rel="alternate" hreflang="${other.hreflang}" href="${absolute(other.path)}" />`,
        ),
        "  </url>",
      ].join("\n"),
    ),
  "</urlset>",
  "",
].join("\n");

await writeFile(join(dist, "sitemap.xml"), sitemap, "utf8");

const robotsPath = join(dist, "robots.txt");
const robots = await readFile(robotsPath, "utf8");
if (!robots.includes("Sitemap:")) {
  await appendFile(robotsPath, `\nSitemap: ${absolute("/sitemap.xml")}\n`, "utf8");
}

console.log(`SEO finalised for ${siteUrl}`);
