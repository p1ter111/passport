import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const isoCountries = require("i18n-iso-countries");
const { countries: countryList } = require("countries-list");
const zhLocale = require("i18n-iso-countries/langs/zh.json");

isoCountries.registerLocale(zhLocale);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const matrixPath = path.join(rootDirectory, "data", "passport-index.json");
const rankingPath = path.join(rootDirectory, "data", "henley-ranking-2026.json");
const outputPath = path.join(rootDirectory, "data", "countries.json");
const passportCoverDirectory = path.join(rootDirectory, "public", "passports");

const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
const rankingSnapshot = JSON.parse(await readFile(rankingPath, "utf8"));
const officialRankings = new Map(rankingSnapshot.countries.map((country) => [country.iso2, country]));
const topOfficialAccess = Math.max(...rankingSnapshot.countries.map((country) => country.access));

const coverSourceOverrides = {
  CN: {
    source: "https://commons.wikimedia.org/wiki/File:People%27s_Republic_of_China_Passport_2012.svg",
    license: "Public domain",
  },
};

const statusKeys = {
  "visa free": "visaFreeCountries",
  "visa on arrival": "visaOnArrivalCountries",
  eta: "etaCountries",
  "e-visa": "eVisaCountries",
  "visa required": "visaRequiredCountries",
  "no admission": "noAdmissionCountries",
};

const continentNames = {
  AF: "非洲",
  AN: "南极洲",
  AS: "亚洲",
  EU: "欧洲",
  NA: "北美洲",
  OC: "大洋洲",
  SA: "南美洲",
};

const specialCountries = {
  XK: {
    name: "Kosovo",
    nameZh: "科索沃",
    nativeName: "Kosova",
    iso3: "XKX",
    numericId: "383",
    region: "欧洲",
  },
};

const passportColorFamilies = {
  亚洲: ["#8D1B2B", "#193E63", "#274F43"],
  欧洲: ["#741C37", "#173E62", "#623244"],
  非洲: ["#2B4A3C", "#35495E", "#6D243B"],
  北美洲: ["#1D355D", "#2E5747", "#7B2338"],
  南美洲: ["#1F5B4C", "#263A66", "#75263B"],
  大洋洲: ["#173E62", "#2E5747", "#6D243B"],
  南极洲: ["#34465B"],
};

function flagFor(code) {
  if (code === "XK") return "🇽🇰";
  return [...code].map((character) => String.fromCodePoint(character.charCodeAt(0) + 127397)).join("");
}

function getMetadata(code) {
  if (specialCountries[code]) return specialCountries[code];
  const listed = countryList[code];
  const name = isoCountries.getName(code, "en") || listed?.name || code;
  const nameZh = isoCountries.getName(code, "zh") || name;
  const nativeName = listed?.native || name;
  const iso3 = isoCountries.alpha2ToAlpha3(code) || code;
  const numericId = String(isoCountries.alpha2ToNumeric(code) || "000").padStart(3, "0");
  const region = continentNames[listed?.continent] || "亚洲";
  return { name, nameZh, nativeName, iso3, numericId, region };
}

const passportWords = {
  ar: "جواز سفر",
  bg: "ПАСПОРТ",
  bn: "পাসপোর্ট",
  cs: "CESTOVNÍ PAS",
  da: "PAS",
  de: "REISEPASS",
  el: "ΔΙΑΒΑΤΗΡΙΟ",
  en: "PASSPORT",
  es: "PASAPORTE",
  et: "PASS",
  fa: "گذرنامه",
  fi: "PASSI",
  fr: "PASSEPORT",
  he: "דרכון",
  hi: "पासपोर्ट",
  hr: "PUTOVNICA",
  hu: "ÚTLEVÉL",
  id: "PASPOR",
  is: "VEGABRÉF",
  it: "PASSAPORTO",
  ja: "旅券",
  ko: "여권",
  lt: "PASAS",
  lv: "PASE",
  ms: "PASPORT",
  nl: "PASPOORT",
  no: "PASS",
  pl: "PASZPORT",
  pt: "PASSAPORTE",
  ro: "PAȘAPORT",
  ru: "ПАСПОРТ",
  sk: "CESTOVNÝ PAS",
  sl: "POTNI LIST",
  sr: "ПАСОШ",
  sv: "PASS",
  th: "หนังสือเดินทาง",
  tr: "PASAPORT",
  uk: "ПАСПОРТ",
  vi: "HỘ CHIẾU",
  zh: "护照",
};

function passportWordFor(code) {
  const language = countryList[code]?.languages?.[0] || "en";
  return passportWords[language] || "PASSPORT";
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function emblemFor(code) {
  const gold = "#d7b65e";
  const hash = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 8;
  const common = `fill="none" stroke="${gold}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;

  const motifs = [
    `<path ${common} d="M150 128c-22 0-38 12-38 12v42c0 31 38 49 38 49s38-18 38-49v-42s-16-12-38-12Z"/><path ${common} d="M150 143v69M127 162h46"/><path ${common} d="M103 150c-19 17-24 43-13 66M197 150c19 17 24 43 13 66"/><path ${common} d="m150 110 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z"/>`,
    `<circle ${common} cx="150" cy="172" r="42"/><path ${common} d="M108 172h84M150 130c14 13 21 27 21 42s-7 29-21 42c-14-13-21-27-21-42s7-29 21-42ZM150 108v12M150 224v12M86 172h12M202 172h12M104 126l9 9M187 209l9 9M196 126l-9 9M113 209l-9 9"/>`,
    `<path ${common} d="M150 141c-15 0-27 8-27 8v35c0 23 27 37 27 37s27-14 27-37v-35s-12-8-27-8Z"/><path ${common} d="M123 158c-27-20-43-15-57-4 18 4 28 13 37 27-12-2-22 0-31 7 22 3 34 11 47 27M177 158c27-20 43-15 57-4-18 4-28 13-37 27 12-2 22 0 31 7-22 3-34 11-47 27"/><circle cx="150" cy="169" r="6" fill="${gold}"/>`,
    `<path ${common} d="m112 151 15-22 23 19 23-19 15 22-8 18h-60Z"/><path ${common} d="M118 180h64M124 191h52M130 202v24M143 202v24M157 202v24M170 202v24M124 233h52"/><circle cx="127" cy="156" r="3" fill="${gold}"/><circle cx="150" cy="156" r="3" fill="${gold}"/><circle cx="173" cy="156" r="3" fill="${gold}"/>`,
    `<path ${common} d="M104 146c-23 30-17 70 12 90M196 146c23 30 17 70-12 90M102 164l-13-7M100 184l-15 1M106 205l-14 8M198 164l13-7M200 184l15 1M194 205l14 8"/><path ${common} d="m150 125 9 20 22 2-17 15 5 22-19-11-19 11 5-22-17-15 22-2Z"/><circle ${common} cx="150" cy="207" r="20"/>`,
    `<path ${common} d="M150 122c-8 16-20 25-36 29 11 8 22 12 34 12-17 12-27 27-29 45 11-7 21-10 31-10 10 0 20 3 31 10-2-18-12-33-29-45 12 0 23-4 34-12-16-4-28-13-36-29Z"/><path ${common} d="M150 198v34M133 232h34"/><circle cx="150" cy="151" r="6" fill="${gold}"/>`,
    `<path ${common} d="M150 128v105M150 150c-18-22-39-24-54-10 18 4 34 14 54 32M150 150c18-22 39-24 54-10-18 4-34 14-54 32M150 179c-20-13-36-10-47 3 18 0 31 5 47 18M150 179c20-13 36-10 47 3-18 0-31 5-47 18"/><path ${common} d="M122 233h56M129 243h42"/>`,
    `<circle ${common} cx="150" cy="174" r="38"/><path ${common} d="m150 115 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z"/><path ${common} d="M95 221c16-10 35-15 55-15s39 5 55 15M110 234h80M125 174h50M150 136v76"/>`,
  ];

  return motifs[hash];
}

function coverSvg(profile) {
  const nativeName = escapeXml(profile.nativeName.toLocaleUpperCase());
  const englishName = escapeXml(profile.name.toLocaleUpperCase());
  const passportWord = escapeXml(passportWordFor(profile.iso2));
  const nativeSize = profile.nativeName.length > 34 ? 10 : profile.nativeName.length > 22 ? 12 : 15;
  const englishSize = profile.name.length > 34 ? 8 : profile.name.length > 22 ? 9 : 11;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 428" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(profile.nameZh)}护照封面示意</title>
  <desc id="desc">Passport Atlas 为 ${escapeXml(profile.name)} 创建的非官方护照封面视觉。</desc>
  <defs>
    <pattern id="texture" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 12 12 0M-3 3 3-3M9 15l6-6" stroke="#fff" stroke-opacity=".025" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="4" y="4" width="292" height="420" rx="14" fill="${profile.passportColor}"/>
  <rect x="4" y="4" width="292" height="420" rx="14" fill="url(#texture)"/>
  <path d="M17 16v396" stroke="#fff" stroke-opacity=".09" stroke-width="3"/>
  <path d="M281 20v388" stroke="#000" stroke-opacity=".12"/>
  <text x="150" y="40" text-anchor="middle" fill="#d7b65e" font-family="Inter,Arial,sans-serif" font-size="${nativeSize}" font-weight="700">${nativeName}</text>
  <text x="150" y="58" text-anchor="middle" fill="#d7b65e" fill-opacity=".86" font-family="Inter,Arial,sans-serif" font-size="${englishSize}" font-weight="600">${englishName}</text>
  <g>${emblemFor(profile.iso2)}</g>
  <text x="150" y="274" text-anchor="middle" fill="#d7b65e" font-family="Inter,Arial,sans-serif" font-size="25" font-weight="800">${profile.iso2}</text>
  <path d="M115 294h70" stroke="#d7b65e" stroke-opacity=".7"/>
  <text x="150" y="330" text-anchor="middle" fill="#d7b65e" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="700">${passportWord}</text>
  <text x="150" y="350" text-anchor="middle" fill="#d7b65e" fill-opacity=".8" font-family="Inter,Arial,sans-serif" font-size="10" font-weight="600">PASSPORT</text>
  <g transform="translate(128 373)" fill="none" stroke="#d7b65e" stroke-width="2">
    <rect width="44" height="28" rx="4"/>
    <circle cx="22" cy="14" r="8"/><path d="M14 14h16M22 6c3 3 4 5 4 8s-1 5-4 8c-3-3-4-5-4-8s1-5 4-8Z"/>
  </g>
  <text x="278" y="404" text-anchor="end" fill="#d7b65e" fill-opacity=".65" font-family="Inter,Arial,sans-serif" font-size="9">${profile.iso3}</text>
</svg>\n`;
}

function countStatuses(rules) {
  const counts = Object.fromEntries(Object.values(statusKeys).map((key) => [key, 0]));
  for (const requirement of Object.values(rules)) {
    const key = statusKeys[requirement.status];
    if (key) counts[key] += 1;
  }
  return counts;
}

const baseProfiles = Object.entries(matrix).map(([iso2, rules]) => {
  const metadata = getMetadata(iso2);
  const coverSourceOverride = coverSourceOverrides[iso2];
  const counts = countStatuses(rules);
  const matrixAccessibleCountries = counts.visaFreeCountries + counts.visaOnArrivalCountries + counts.etaCountries;
  const official = officialRankings.get(iso2);
  const accessibleCountries = official?.access ?? matrixAccessibleCountries;
  const freedomScore = official
    ? Math.round((accessibleCountries / topOfficialAccess) * 100)
    : Math.round((matrixAccessibleCountries / (Object.keys(rules).length - 1)) * 100);
  const palette = passportColorFamilies[metadata.region] || ["#34465B"];
  const colorIndex = [...iso2].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palette.length;

  return {
    name: metadata.name,
    nameZh: metadata.nameZh,
    nativeName: metadata.nativeName,
    flag: flagFor(iso2),
    iso2,
    iso3: metadata.iso3,
    numericId: metadata.numericId,
    passportRank: 0,
    visaFreeCountries: counts.visaFreeCountries,
    visaOnArrivalCountries: counts.visaOnArrivalCountries,
    etaCountries: counts.etaCountries,
    eVisaCountries: counts.eVisaCountries,
    visaRequiredCountries: counts.visaRequiredCountries,
    noAdmissionCountries: counts.noAdmissionCountries,
    accessibleCountries,
    matrixAccessibleCountries,
    freedomScore,
    region: metadata.region,
    passportColor: palette[colorIndex],
    passportCover: `/passports-hq/${metadata.iso3.toLowerCase()}.webp`,
    passportCoverSource: coverSourceOverride?.source || `https://img.passportindex.org/countries/${iso2.toLowerCase()}.png`,
    passportCoverLicense: coverSourceOverride?.license || "Passport Index source",
    passportCoverNote: "实物封面参考图，不同签发年份及护照版本可能存在差异。",
    intro: `${metadata.nameZh}护照无需提前办理签证可进入 ${accessibleCountries} 个目的地，其中免签 ${counts.visaFreeCountries} 个、落地签 ${counts.visaOnArrivalCountries} 个、ETA ${counts.etaCountries} 个。`,
    aliases: [metadata.name, metadata.nameZh, iso2, metadata.iso3, `${metadata.nameZh}护照`, `${metadata.name} passport`],
    dataReady: true,
  };
});

const sortedByMobility = [...baseProfiles].sort((left, right) =>
  right.accessibleCountries - left.accessibleCountries ||
  left.name.localeCompare(right.name),
);

let previousScore = null;
let previousRank = 0;
sortedByMobility.forEach((profile, index) => {
  const official = officialRankings.get(profile.iso2);
  if (official) {
    profile.passportRank = official.rank;
  } else {
    if (profile.accessibleCountries !== previousScore) {
      previousRank = index + 1;
      previousScore = profile.accessibleCountries;
    }
    profile.passportRank = previousRank;
  }
});

await writeFile(outputPath, `${JSON.stringify(sortedByMobility, null, 2)}\n`, "utf8");
await mkdir(passportCoverDirectory, { recursive: true });
await Promise.all(
  sortedByMobility.map((profile) =>
    writeFile(path.join(passportCoverDirectory, `${profile.iso3.toLowerCase()}.svg`), coverSvg(profile), "utf8"),
  ),
);
console.log(`Generated ${sortedByMobility.length} passport profiles at ${outputPath}`);
console.log(`Generated ${sortedByMobility.length} passport covers at ${passportCoverDirectory}`);
