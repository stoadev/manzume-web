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

console.log(`search-index.json yazıldı: ${index.length} manzume.`);
