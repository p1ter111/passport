import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const countries = JSON.parse(
  await readFile(path.join(rootDirectory, "data", "countries.json"), "utf8"),
);
const minimumWidth = 600;
const minimumHeight = 850;
const failures = [];
const dimensions = [];

for (const country of countries) {
  if (!country.passportCover.startsWith("/passports-hq/")) {
    failures.push(`${country.iso2}: unexpected path ${country.passportCover}`);
    continue;
  }

  const imagePath = path.join(rootDirectory, "public", country.passportCover.slice(1));

  try {
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    dimensions.push({ iso2: country.iso2, width, height });

    if (width < minimumWidth || height < minimumHeight) {
      failures.push(
        `${country.iso2}: ${width}x${height}, minimum is ${minimumWidth}x${minimumHeight}`,
      );
    }
  } catch (error) {
    failures.push(`${country.iso2}: ${error.message}`);
  }
}

if (failures.length) {
  throw new Error(`Passport cover validation failed:\n${failures.join("\n")}`);
}

const widths = dimensions.map((item) => item.width);
const heights = dimensions.map((item) => item.height);

console.log(
  `Validated ${dimensions.length} high-resolution covers. ` +
    `Range: ${Math.min(...widths)}-${Math.max(...widths)}px wide, ` +
    `${Math.min(...heights)}-${Math.max(...heights)}px high.`,
);
