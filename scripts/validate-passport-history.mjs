import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const countries = JSON.parse(await readFile(path.join(root, "data/countries.json"), "utf8"));
const history = JSON.parse(await readFile(path.join(root, "data/passport-history-sources.json"), "utf8"));
const countryCodes = new Set(countries.map((country) => country.iso3));
const requiredCategories = ["design", "identity", "security", "standards"];
let editionCount = 0;

for (const country of countries) {
  if (!Array.isArray(history[country.iso3]) || history[country.iso3].length === 0) {
    throw new Error(`${country.iso3}: every project country must have a sourced passport timeline`);
  }
}

for (const [iso3, entries] of Object.entries(history)) {
  if (!countryCodes.has(iso3)) throw new Error(`Unknown history country code: ${iso3}`);
  if (!Array.isArray(entries) || entries.length === 0) throw new Error(`${iso3}: history must contain at least one edition`);

  const periods = new Set();
  let previousYear = 0;
  let hasCurrentReference = false;
  let hasHistoricalEvidence = false;
  for (const entry of entries) {
    editionCount += 1;
    if (periods.has(entry.period)) throw new Error(`${iso3}: duplicate period ${entry.period}`);
    periods.add(entry.period);
    if (entry.year < previousYear) throw new Error(`${iso3}: entries must be sorted by year`);
    previousYear = entry.year;

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
    const officialIssue = !entry.dateType || entry.dateType === "official-issue";
    const expectedCategories = officialIssue ? requiredCategories : ["design"];
    for (const category of expectedCategories) {
      if (!categories.has(category)) throw new Error(`${iso3} ${entry.period}: missing ${category} change`);
    }
    for (const change of entry.changes) {
      if (!change.detail?.en || !change.detail?.zh) throw new Error(`${iso3} ${entry.period}: incomplete ${change.category} translation`);
    }

    if (entry.dateType === "archive-observed") {
      if (!entry.observedAt || Number.isNaN(Date.parse(entry.observedAt))) throw new Error(`${iso3} ${entry.period}: invalid archive capture date`);
      hasHistoricalEvidence = true;
    }
    if (officialIssue && !entry.isCurrent) hasHistoricalEvidence = true;
    if (entry.isCurrent || entry.dateType === "current-reference") hasCurrentReference = true;
  }
  if (!hasHistoricalEvidence) throw new Error(`${iso3}: timeline must include at least one historical source image`);
  if (!hasCurrentReference && iso3 !== "CHN") throw new Error(`${iso3}: timeline must include the current sourced cover`);
}

console.log(`Validated ${editionCount} sourced passport timeline entries across all ${countries.length} countries.`);
