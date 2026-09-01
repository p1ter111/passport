import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const countries = JSON.parse(await readFile(path.join(root, "data/countries.json"), "utf8"));
const history = JSON.parse(await readFile(path.join(root, "data/passport-history-sources.json"), "utf8"));
const countryCodes = new Set(countries.map((country) => country.iso3));
const requiredCategories = ["design", "identity", "security", "standards"];
let editionCount = 0;

for (const [iso3, entries] of Object.entries(history)) {
  if (!countryCodes.has(iso3)) throw new Error(`Unknown history country code: ${iso3}`);
  if (!Array.isArray(entries) || entries.length === 0) throw new Error(`${iso3}: history must contain at least one edition`);

  const periods = new Set();
  for (const entry of entries) {
    editionCount += 1;
    if (periods.has(entry.period)) throw new Error(`${iso3}: duplicate period ${entry.period}`);
    periods.add(entry.period);

    for (const field of ["year", "period", "cover", "sourceUrl", "evidenceUrl", "license", "author"]) {
      if (entry[field] === undefined || entry[field] === "") throw new Error(`${iso3} ${entry.period}: missing ${field}`);
    }
    for (const locale of ["en", "zh"]) {
      if (!entry.title?.[locale] || !entry.description?.[locale]) throw new Error(`${iso3} ${entry.period}: missing ${locale} copy`);
    }
    if (!entry.sourceUrl.startsWith("https://") || !entry.evidenceUrl.startsWith("https://")) {
      throw new Error(`${iso3} ${entry.period}: source and evidence URLs must use HTTPS`);
    }

    const assetPath = path.join(root, "public", entry.cover.replace(/^\//, ""));
    await access(assetPath);

    const categories = new Set(entry.changes?.map((change) => change.category));
    for (const category of requiredCategories) {
      if (!categories.has(category)) throw new Error(`${iso3} ${entry.period}: missing ${category} change`);
    }
    for (const change of entry.changes) {
      if (!change.detail?.en || !change.detail?.zh) throw new Error(`${iso3} ${entry.period}: incomplete ${change.category} translation`);
    }
  }
}

console.log(`Validated ${editionCount} sourced historical passport editions across ${Object.keys(history).length} countries.`);
