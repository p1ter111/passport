import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const manifestPath = process.argv[2];

if (!manifestPath) {
  throw new Error("Usage: node scripts/import-passport-thumbnail-bundle.mjs <manifest.json>");
}

const countries = JSON.parse(
  await readFile(path.join(rootDirectory, "data", "countries.json"), "utf8"),
);
const manifest = JSON.parse(await readFile(path.resolve(manifestPath), "utf8"));
const outputDirectory = path.join(rootDirectory, "public", "passports-real");
const sourceByName = new Map(manifest.assets.map((asset) => [asset.name.toLowerCase(), asset]));
const sources = {};

await mkdir(outputDirectory, { recursive: true });

for (const country of countries) {
  const asset = sourceByName.get(`${country.iso2.toLowerCase()}.png`);
  if (!asset) throw new Error(`No thumbnail found for ${country.iso2}`);

  const outputFile = `${country.iso3.toLowerCase()}.webp`;
  const metadata = await sharp(asset.path).metadata();
  await sharp(asset.path)
    .webp({ quality: 96, smartSubsample: true })
    .toFile(path.join(outputDirectory, outputFile));

  sources[country.iso3] = {
    country: country.name,
    file: outputFile,
    source: asset.url,
    sourcePage: "https://www.passportindex.org/",
    width: metadata.width,
    height: metadata.height,
    note: "Publicly displayed passport-cover thumbnail; source terms apply.",
  };
}

await writeFile(
  path.join(outputDirectory, "sources.json"),
  `${JSON.stringify(sources, null, 2)}\n`,
  "utf8",
);

console.log(`Imported ${Object.keys(sources).length} 112x160 passport thumbnails.`);

