import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const countriesPath = path.join(rootDirectory, "data", "countries.json");
const outputDirectory = path.join(rootDirectory, "public", "passports-real");

const upstreamCommit = "5139d31affd804690484ccdf79f5aec3dd8ea070";
const upstreamRoot = `https://raw.githubusercontent.com/ChengCPU/visa-map/${upstreamCommit}`;
const upstreamRepository = "https://github.com/ChengCPU/visa-map";

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "PassportAtlas/0.1 (passport cover importer)" },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

const countries = JSON.parse(await readFile(countriesPath, "utf8"));
const visaPolicy = JSON.parse(
  (await fetchBuffer(`${upstreamRoot}/public/visaPolicy.json`)).toString("utf8"),
);

await mkdir(outputDirectory, { recursive: true });

const sources = {};

async function importCountry(country) {
  const matches = Object.keys(visaPolicy).filter(
    (passportKey) => visaPolicy[passportKey]?.[country.iso2] === 0,
  );
  const passportKey = country.iso2 === "IL" ? "israel" : matches[0];

  if (!passportKey) {
    throw new Error(`No upstream passport cover mapping found for ${country.iso2}`);
  }

  const sourceFile = `${passportKey}.webp`;
  const outputFile = `${country.iso3.toLowerCase()}.webp`;
  const sourceUrl = `${upstreamRoot}/public/passports/${sourceFile}`;
  await writeFile(path.join(outputDirectory, outputFile), await fetchBuffer(sourceUrl));

  return [country.iso3, {
    country: country.name,
    file: outputFile,
    upstreamFile: sourceFile,
    source: `${upstreamRepository}/blob/${upstreamCommit}/public/passports/${sourceFile}`,
    license: "GPL-3.0",
  }];
}

for (let index = 0; index < countries.length; index += 16) {
  const batch = countries.slice(index, index + 16);
  const imported = await Promise.all(batch.map(importCountry));
  for (const [iso3, source] of imported) sources[iso3] = source;
}

await writeFile(
  path.join(outputDirectory, "LICENSE-GPL-3.0.txt"),
  await fetchBuffer(`${upstreamRoot}/LICENSE.md`),
);

await writeFile(
  path.join(outputDirectory, "sources.json"),
  `${JSON.stringify(sources, null, 2)}\n`,
  "utf8",
);

console.log(`Imported ${Object.keys(sources).length} real passport cover references into ${outputDirectory}`);
