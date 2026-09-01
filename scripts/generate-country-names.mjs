import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { languages } from "countries-list";

const countries = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "countries.json"), "utf8"));
const require = createRequire(import.meta.url);
const cldrRoot = path.join(path.dirname(require.resolve("cldr-localenames-full/package.json")), "main");
const isoCountryNamesRoot = path.join(path.dirname(require.resolve("i18n-iso-countries/package.json")), "langs");

async function loadCldrTerritories(locale) {
  try {
    const content = await fs.readFile(path.join(cldrRoot, locale, "territories.json"), "utf8");
    const document = JSON.parse(content);
    const localeKey = Object.keys(document.main)[0];
    return document.main[localeKey]?.localeDisplayNames?.territories ?? null;
  } catch {
    return null;
  }
}

async function loadIsoCountryNames(locale) {
  try {
    const content = await fs.readFile(path.join(isoCountryNamesRoot, `${locale}.json`), "utf8");
    return JSON.parse(content).countries ?? null;
  } catch {
    return null;
  }
}

function createExactDisplayNames(locale) {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    const requested = locale.toLowerCase().split("-")[0];
    const resolved = displayNames.resolvedOptions().locale.toLowerCase().split("-")[0];
    return requested === resolved ? displayNames : null;
  } catch {
    return null;
  }
}

const names = {};
const sourceCounts = { cldr: 0, iso: 0, intl: 0, english: 0 };
const languageCodes = [...Object.keys(languages), "zh-TW"];
for (const code of languageCodes) {
  const cldrTerritories = await loadCldrTerritories(code);
  const isoCountryNames = await loadIsoCountryNames(code);
  const displayNames = createExactDisplayNames(code);
  names[code] = Object.fromEntries(countries.map((country) => {
    const cldrName = cldrTerritories?.[country.iso2];
    if (cldrName && cldrName !== country.iso2) {
      sourceCounts.cldr += 1;
      return [country.iso2, cldrName];
    }

    const isoName = isoCountryNames?.[country.iso2];
    if (isoName && isoName !== country.iso2) {
      sourceCounts.iso += 1;
      return [country.iso2, isoName];
    }

    const intlName = displayNames?.of(country.iso2);
    if (intlName && intlName !== country.iso2) {
      sourceCounts.intl += 1;
      return [country.iso2, intlName];
    }

    sourceCounts.english += 1;
    return [country.iso2, country.name];
  }));
}

for (const [code, localizedNames] of Object.entries(names)) {
  if (code === "zh") continue;
  const chineseMatches = countries.filter((country) => localizedNames[country.iso2] === country.nameZh).length;
  if (chineseMatches > countries.length * 0.6) {
    throw new Error(`${code} country names unexpectedly resolved to Chinese (${chineseMatches}/${countries.length})`);
  }
}

const outputPath = path.join(process.cwd(), "data", "country-names.json");
await fs.writeFile(outputPath, `${JSON.stringify(names, null, 2)}\n`, "utf8");
console.log(`wrote ${Object.keys(names).length} localized country-name sets to ${outputPath}`);
console.log(`sources: CLDR ${sourceCounts.cldr}, ISO ${sourceCounts.iso}, Intl ${sourceCounts.intl}, English fallback ${sourceCounts.english}`);
