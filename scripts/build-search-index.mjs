import fs from "node:fs";
import path from "node:path";

const SLUG = "divan-i-kenz-i-sumus";
const srcPath = path.join(process.cwd(), "data", SLUG, "manzumeler.json");
const outDir = path.join(process.cwd(), "public");
const outPath = path.join(outDir, "search-index.json");

const raw = fs.readFileSync(srcPath, "utf-8");
const data = JSON.parse(raw);

const index = data.poems.map((poem) => ({
  no: poem.no,
  firstLine: poem.firstLine,
  lines: poem.blocks.flat(),
}));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(index), "utf-8");

// Kenz'il-Maarif: bahis/manzume/giriş tam metin indeksi (Arapça yer tutucuları gürültü, atılır).
const kenzulSrc = path.join(process.cwd(), "data", "kenzul-maarif", "kitap.json");
const kenzulOut = path.join(outDir, "search-index-kenzul-maarif.json");
const kenzul = JSON.parse(fs.readFileSync(kenzulSrc, "utf-8"));
const ARABIC_TEXT = "[Arapça ibare]";
const stripArabic = (s) => s.split(ARABIC_TEXT).join("").replace(/\s{2,}/g, " ").trim();

const kenzulIndex = kenzul.entries.map((e) => ({
  type: e.type,
  no: e.no,
  title: stripArabic(e.title),
  text: (e.paragraphs ?? e.lines ?? []).map(stripArabic).filter(Boolean),
}));

fs.writeFileSync(kenzulOut, JSON.stringify(kenzulIndex), "utf-8");

console.log(
  `search-index.json yazıldı: ${index.length} manzume; ` +
    `search-index-kenzul-maarif.json yazıldı: ${kenzulIndex.length} kayıt.`,
);
