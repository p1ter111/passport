import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const countries = JSON.parse(
  await readFile(path.join(rootDirectory, "data", "countries.json"), "utf8"),
);
const outputDirectory = path.join(rootDirectory, "public", "passports-hq");
const minimumWidth = 600;
const minimumHeight = 850;
const concurrency = 5;

const sourceOverrides = {
  CN: {
    source: "https://commons.wikimedia.org/wiki/File:People%27s_Republic_of_China_Passport_2012.svg",
    license: "Public domain",
    preserveExisting: true,
  },
};

async function discoverManifestPaths() {
  const assetRoot = path.join(tmpdir(), "browser-use", "assets");
  const entries = await readdir(assetRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(assetRoot, entry.name, "manifest.json"));
}

async function buildAssetIndex(manifestPaths) {
  const assets = new Map();

  for (const manifestPath of manifestPaths) {
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      for (const asset of manifest.assets || []) {
        const match = asset.url?.match(
          /^https:\/\/img\.passportindex\.org\/countries\/([a-z]{2})\.png$/,
        );
        if (match) assets.set(match[1].toUpperCase(), asset);
      }
    } catch {
      // Ignore unrelated or incomplete temporary browser manifests.
    }
  }

  return assets;
}

async function verifyImage(input, label) {
  const metadata = await sharp(input).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width < minimumWidth || height < minimumHeight) {
    throw new Error(
      `${label} is only ${width}x${height}; minimum is ${minimumWidth}x${minimumHeight}`,
    );
  }

  return { width, height };
}

const requestedManifests = process.argv.slice(2).map((item) => path.resolve(item));
const manifestPaths = requestedManifests.length
  ? requestedManifests
  : await discoverManifestPaths();
const sourceAssets = await buildAssetIndex(manifestPaths);

async function importCountry(country) {
  const iso2 = country.iso2.toUpperCase();
  const iso3 = country.iso3.toLowerCase();
  const outputFile = `${iso3}.webp`;
  const outputPath = path.join(outputDirectory, outputFile);
  const override = sourceOverrides[iso2];

  if (override?.preserveExisting) {
    const dimensions = await verifyImage(outputPath, `${iso2} existing cover`);
    return {
      iso3: country.iso3,
      record: {
        country: country.name,
        file: outputFile,
        source: override.source,
        license: override.license,
        ...dimensions,
      },
    };
  }

  const asset = sourceAssets.get(iso2);
  if (!asset) {
    throw new Error(`No full-size browser asset found for ${iso2}`);
  }

  const sourceDimensions = await verifyImage(asset.path, `${iso2} source cover`);
  const webp = await sharp(asset.path)
    .webp({ quality: 96, smartSubsample: true })
    .toBuffer();

  await writeFile(outputPath, webp);
  const outputDimensions = await verifyImage(outputPath, `${iso2} converted cover`);

  if (
    outputDimensions.width !== sourceDimensions.width ||
    outputDimensions.height !== sourceDimensions.height
  ) {
    throw new Error(`${iso2} dimensions changed during conversion`);
  }

  return {
    iso3: country.iso3,
    record: {
      country: country.name,
      file: outputFile,
      source: asset.url,
      sourcePage: `https://www.passportindex.org/?country=${iso2.toLowerCase()}`,
      license: "Passport Index source terms apply",
      ...outputDimensions,
    },
  };
}

async function runPool(items, workerCount) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await importCountry(items[index]);
      completed += 1;
      process.stdout.write(`\rImported ${completed}/${items.length} high-resolution covers`);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  process.stdout.write("\n");
  return results;
}

await mkdir(outputDirectory, { recursive: true });

const imported = await runPool(countries, concurrency);
const sources = Object.fromEntries(imported.map(({ iso3, record }) => [iso3, record]));

await writeFile(
  path.join(outputDirectory, "sources.json"),
  `${JSON.stringify(sources, null, 2)}\n`,
  "utf8",
);

console.log(
  `Verified ${imported.length} passport covers at or above ${minimumWidth}x${minimumHeight}.`,
);
