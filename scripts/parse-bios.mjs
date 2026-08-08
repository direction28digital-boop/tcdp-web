// Parses the AZ Pound Pups bios markdown into src/data/bios.json keyed by animal id.
// Source: _Direction28/AZ Pound Pups Dog Bios 2026-08-06.md (generated from real MCACC records).
// Run: node scripts/parse-bios.mjs <path-to-md>
import fs from "node:fs";

const src = process.argv[2];
const raw = fs.readFileSync(src, "utf8");

// Blocks are separated by --- lines. A dog block starts with "NAME · A####### · ..."
const blocks = raw.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
const headerRe = /^(.+?)\s+·\s+(A\d+)\s+·\s+(.+?)\s+·\s+(.+)$/;

const bios = {};
for (const block of blocks) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  // Skip section headings like "## DEADLINE SATURDAY, AUGUST 9"
  const startIdx = lines.findIndex((l) => headerRe.test(l));
  if (startIdx === -1) continue;

  const m = lines[startIdx].match(headerRe);
  const [, name, animalId, age, breed] = m;

  const rest = lines.slice(startIdx + 1);
  const bullets = [];
  let location = "";
  let story = "";
  let needs = "";

  for (const line of rest) {
    if (line.startsWith("•")) bullets.push(line.replace(/^•\s*/, ""));
    else if (/DEADLINE:/i.test(line)) location = line.split("·")[0].trim();
    else if (/^Needs:/i.test(line)) needs = line.replace(/^Needs:\s*/i, "");
    else if (/^Apply to save/i.test(line)) continue;
    else if (/^HOLD/i.test(line)) continue;
    else if (!story) story = line;
    else story += " " + line;
  }

  bios[animalId] = {
    animal_id: animalId,
    name: name.replace(/\s*\(HOLD.*\)$/i, "").trim(),
    age,
    breed,
    location,
    bullets,
    story,
    needs,
  };
}

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/bios.json", JSON.stringify(bios, null, 2) + "\n");
console.log(`Parsed ${Object.keys(bios).length} bios`);
const missing = Object.values(bios).filter((b) => !b.story || b.bullets.length === 0);
if (missing.length) console.log("Incomplete:", missing.map((b) => b.name));
