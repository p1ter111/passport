import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const outputPath = path.join(rootDirectory, "data", "henley-ranking-2026.json");
const apiUrl = "https://api.henleypassportindex.com/api/v3/countries";
const sourceUrl = "https://www.henleyglobal.com/passport-index/ranking";

const response = await fetch(apiUrl, { headers: { accept: "application/json" } });
if (!response.ok) {
  throw new Error(`Henley API request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const countries = (payload.countries || [])
  .filter((country) => country.has_data && country.code && country.data?.["2026"])
  .map((country) => ({
    iso2: country.code,
    name: country.country,
    rank: Number(country.data["2026"].rank),
    access: Number(country.data["2026"].visa_free_count ?? country.visa_free_count),
  }))
  .sort((left, right) => left.iso2.localeCompare(right.iso2));

if (countries.length !== 199 || countries.some((country) => !Number.isFinite(country.rank) || !Number.isFinite(country.access))) {
  throw new Error(`Unexpected Henley payload: received ${countries.length} complete countries`);
}

const snapshot = {
  source: "Henley Passport Index",
  sourceUrl,
  apiUrl,
  year: 2026,
  edition: "July 2026",
  retrievedAt: new Date().toISOString(),
  methodology: "Number of destinations accessible without obtaining a prior visa; visa-on-arrival and ETA access are included.",
  countries,
};

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Saved ${countries.length} Henley 2026 passport rankings to ${outputPath}`);
console.log("Leaders:", countries.filter((country) => country.rank <= 2));
