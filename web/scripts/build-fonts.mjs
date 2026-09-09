/* Build the three self-hosted Noto Sans subsets the site ships.
 *
 * The page is one type system in three scripts: Noto Sans for English, Noto Sans SC
 * for Simplified Chinese, Noto Sans JP for Japanese. Shipping the full families is
 * not an option — Noto Sans SC alone is 17MB — and shipping Google's ~100 unicode
 * range chunks per family would mean a hundred files nobody can audit. Every word
 * this site renders is in source, so the subset is cut from exactly that.
 *
 * Run it when the copy changes:
 *
 *   .venv/bin/pip install "fonttools[woff]"     # once, from the repo root
 *   node web/scripts/build-fonts.mjs
 *
 * It needs the upstream variable fonts, which are NOT committed: the script fetches
 * them from google/fonts into a cache directory and writes only the subsets and the
 * licences into web/public/fonts/. The licences are copied from the same upstream
 * directory as the font they cover, which is what the OFL asks for.
 *
 * What each output covers:
 *
 *   noto-sans-latin.woff2   Latin, by unicode range rather than by our own text, so
 *                           any English copy written later still renders. Small
 *                           enough that being generous costs nothing.
 *   noto-sans-sc.woff2      every character the Chinese page renders, plus ASCII.
 *   noto-sans-jp.woff2      every character the Japanese page renders, plus ASCII.
 *   noto-sans-cjk-bits.woff2  the handful of CJK characters that appear on the
 *                           English and Japanese pages (the footer lists all three
 *                           language names, and the language switch says 中文). Cut
 *                           from SC, because the simplified forms are the ones the
 *                           Latin and Japanese faces do not have.
 *
 * All four keep the weight axis, so 400/500/600/700 come out of one file each.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const repo = join(web, "..");
const out = join(web, "public/fonts");
const cache = join(repo, ".fontcache");

/* Upstream. google/fonts is the fonts' own distribution repository: the same files
   fonts.google.com serves, next to the licence that covers them. */
const RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl";
const UPSTREAM = {
  latin: { dir: "notosans", file: "NotoSans%5Bwdth,wght%5D.ttf", local: "NotoSans.ttf", licence: "noto-sans-OFL.txt" },
  sc: { dir: "notosanssc", file: "NotoSansSC%5Bwght%5D.ttf", local: "NotoSansSC.ttf", licence: "noto-sans-sc-OFL.txt" },
  jp: { dir: "notosansjp", file: "NotoSansJP%5Bwght%5D.ttf", local: "NotoSansJP.ttf", licence: "noto-sans-jp-OFL.txt" },
};

/* Punctuation, symbols and spaces the layout can produce without any of them being
   written in the copy: the arrows in the buttons are SVG, but the middle dots, the
   ellipses, the full-width brackets and the non-breaking spaces are text. */
const ALWAYS = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ..." !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
  ..." ·—–…‘’“”„«»†‡•©®™°±×÷≈≠≤≥→←↑↓↗↘§¶",
  ..."、。，．：；！？「」『』（）〈〉《》【】〔〕〜～ー・％＋－＝",
];

/** Every character the given locale can put on the screen, taken from the copy. */
async function charactersByLocale() {
  mkdirSync(cache, { recursive: true });
  const bundle = join(cache, "copy.mjs");
  await build({
    entryPoints: [join(here, "fontCopyEntry.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: bundle,
    logLevel: "warning",
  });
  const { copyByLocale } = await import(`file://${bundle}?t=${Date.now()}`);
  const found = {};
  for (const [locale, value] of Object.entries(copyByLocale())) {
    const set = new Set(ALWAYS);
    walk(value, set);
    found[locale] = set;
  }
  return found;
}

function walk(value, set) {
  if (typeof value === "string") for (const ch of value) set.add(ch);
  else if (Array.isArray(value)) for (const item of value) walk(item, set);
  else if (value && typeof value === "object") for (const item of Object.values(value)) walk(item, set);
}

function download(entry) {
  mkdirSync(cache, { recursive: true });
  const path = join(cache, entry.local);
  if (!existsSync(path)) {
    console.log(`fetching ${entry.local} …`);
    execFileSync("curl", ["-sSL", "-o", path, `${RAW}/${entry.dir}/${entry.file}`], { stdio: "inherit" });
  }
  const licence = join(out, entry.licence);
  execFileSync("curl", ["-sSL", "-o", licence, `${RAW}/${entry.dir}/OFL.txt`], { stdio: "inherit" });
  return path;
}

/** One woff2, cut with pyftsubset and keeping the weight axis. */
function subset(source, name, { text, unicodes }) {
  const target = join(out, `${name}.woff2`);
  const args = [
    source,
    `--output-file=${target}`,
    "--flavor=woff2",
    "--layout-features=kern,liga,clig,calt,locl,ccmp,mark,mkmk,vert,vrt2,palt",
    "--no-hinting",
    "--desubroutinize",
    "--drop-tables+=DSIG",
    "--name-IDs=1,2,3,4,5,6",
    "--notdef-outline",
    "--recommended-glyphs",
  ];
  if (unicodes) args.push(`--unicodes=${unicodes}`);
  if (text) {
    const list = join(cache, `${name}.txt`);
    writeFileSync(list, text, "utf8");
    args.push(`--text-file=${list}`);
  }
  execFileSync(join(repo, ".venv/bin/pyftsubset"), args, { stdio: "inherit" });
  const kb = (statSync(target).size / 1024).toFixed(1);
  console.log(`${name}.woff2  ${kb} kB`);
}

/** Noto Sans with its width axis fixed at normal, so only weight ships. */
function pinWidth(source) {
  const target = join(cache, "NotoSans-wdth100.ttf");
  execFileSync(join(repo, ".venv/bin/fonttools"), ["varLib.instancer", "-o", target, source, "wdth=100"], { stdio: "ignore" });
  return target;
}

/** Every codepoint a font actually has a glyph for, read out of its cmap. */
function coverage(source) {
  const code = [
    "import sys; from fontTools.ttLib import TTFont",
    "f = TTFont(sys.argv[1], lazy=True)",
    "sys.stdout.write(' '.join(str(c) for c in f.getBestCmap()))",
  ].join("\n");
  const out = execFileSync(join(repo, ".venv/bin/python"), ["-c", code, source], { encoding: "utf8", maxBuffer: 1 << 26 });
  return new Set(out.split(" ").map(Number));
}

/** What `chars` needs and `font` has no glyph for. */
function missingFrom(chars, font) {
  const have = coverage(font);
  return [...chars].filter((ch) => !have.has(ch.codePointAt(0)));
}

const chars = await charactersByLocale();
mkdirSync(out, { recursive: true });

const latin = download(UPSTREAM.latin);
const sc = download(UPSTREAM.sc);
const jp = download(UPSTREAM.jp);

/* Latin by range: basic Latin, Latin-1, Latin Extended-A, the punctuation block and
   the currency signs. That is the whole of what English typography reaches for.

   Noto Sans ships a width axis as well as a weight one, and the page never asks for
   a condensed setting, so the width is pinned before the cut and only the weight
   axis is carried into the file. */
subset(pinWidth(latin), "noto-sans-latin", {
  unicodes: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2192,U+2190,U+2212,U+2215,U+FEFF,U+FFFD",
});
subset(sc, "noto-sans-sc", { text: [...chars["zh-CN"]].join("") });
subset(jp, "noto-sans-jp", { text: [...chars.ja].join("") });

/* Nothing on this site is written in one script only. The footer of all three pages
   lists "English / 日本語 / 简体中文" and the language switch says 中文, so the
   English page needs CJK the Latin face has never had, and the Japanese page needs
   the simplified forms its own face was never cut with. Rather than guess which
   characters those are, ask both faces what they are missing and cut exactly that
   from the simplified face, which is the one that has all of it. It comes to a
   couple of dozen glyphs, and it is what keeps a page from falling through to
   whatever CJK font the operating system happens to offer. */
const bits = new Set([
  ...missingFrom(chars.en, join(out, "noto-sans-latin.woff2")),
  ...missingFrom(chars.ja, join(out, "noto-sans-jp.woff2")),
]);
subset(sc, "noto-sans-cjk-bits", { text: [...bits].join("") });

const summary = [...Object.entries(chars)].map(([k, v]) => `${k}: ${v.size} characters`).join(", ");
console.log(`built from copy — ${summary}`);
console.log(`licences written next to the fonts in ${out.replace(repo + "/", "")}`);
