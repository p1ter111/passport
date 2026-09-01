import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const shouldWrite = process.argv.includes("--write");
const forceRefresh = process.argv.includes("--refresh");
const archiveStartYear = 2014;
const archiveEndYear = 2025;
const visualChangeThreshold = 8;
const maxArchiveEditions = 4;
const userAgent = "PassportAtlas/1.0 (https://github.com/p1ter111/passport)";
const cdxUrl = new URL("https://web.archive.org/cdx/search/cdx");
cdxUrl.search = new URLSearchParams({
  url: "www.passportindex.org/countries/",
  matchType: "prefix",
  output: "json",
  fl: "urlkey,timestamp,digest,statuscode,mimetype,original",
  filter: "statuscode:200",
  collapse: "digest",
  from: String(archiveStartYear),
  to: String(archiveEndYear),
  limit: "10000",
}).toString();
cdxUrl.searchParams.append("filter", "mimetype:image/png");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return response;
      if (attempt === attempts) throw new Error(`${url} returned ${response.status}`);
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await wait(700 * attempt);
  }
}

function timestampToIso(timestamp) {
  const value = String(timestamp);
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`;
}

function archiveReplayUrl(record, raw = false) {
  return `https://web.archive.org/web/${record.timestamp}${raw ? "id_" : ""}/${record.original}`;
}

function exactCountryCode(original) {
  try {
    const pathname = new URL(original).pathname.toLowerCase();
    return pathname.match(/^\/countries\/([a-z]{2})\.png$/)?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

async function imageSignature(input) {
  return sharp(input)
    .resize(48, 64, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();
}

function imageDistance(left, right) {
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;
  let total = 0;
  for (let index = 0; index < left.length; index += 1) total += Math.abs(left[index] - right[index]);
  return total / left.length;
}

async function readCachedArchiveImage(record, iso3) {
  const cacheDirectory = path.join(os.tmpdir(), "passport-atlas-wayback", iso3.toLowerCase());
  const cachePath = path.join(cacheDirectory, `${record.timestamp}.png`);
  await mkdir(cacheDirectory, { recursive: true });

  if (!forceRefresh) {
    try {
      await access(cachePath);
      return { buffer: await readFile(cachePath), cachePath };
    } catch {
      // The cache is optional; download the archived image below.
    }
  }

  const response = await fetchWithRetry(archiveReplayUrl(record, true));
  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 180 || metadata.height < 240) {
    throw new Error(`${iso3} ${record.timestamp}: archive image is too small (${metadata.width}x${metadata.height})`);
  }
  await writeFile(cachePath, buffer);
  return { buffer, cachePath };
}

function evenlyLimitEditions(editions) {
  if (editions.length <= maxArchiveEditions) return editions;
  const selected = [editions[0]];
  const interiorSlots = maxArchiveEditions - 2;
  for (let slot = 1; slot <= interiorSlots; slot += 1) {
    const index = Math.round((slot * (editions.length - 1)) / (interiorSlots + 1));
    selected.push(editions[index]);
  }
  selected.push(editions.at(-1));
  return [...new Map(selected.map((edition) => [edition.record.timestamp, edition])).values()];
}

async function selectArchiveEditions(country, records) {
  const visuallyDistinct = [];
  let previousSignature = null;

  for (const record of records) {
    try {
      const { buffer } = await readCachedArchiveImage(record, country.iso3);
      const signature = await imageSignature(buffer);
      const distance = imageDistance(previousSignature, signature);
      if (!previousSignature || distance >= visualChangeThreshold) {
        visuallyDistinct.push({ record, buffer, signature, distance });
        previousSignature = signature;
      }
    } catch (error) {
      console.warn(`${country.iso3}: skipped ${record.timestamp} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return evenlyLimitEditions(visuallyDistinct);
}

function archiveEntry(country, edition, index, previousEdition) {
  const year = Number(edition.record.timestamp.slice(0, 4));
  const observedDate = timestampToIso(edition.record.timestamp);
  const firstObservation = index === 0;
  const changeDetail = firstObservation
    ? {
        en: `This is the earliest usable Passport Index cover image found in the ${archiveStartYear}-${archiveEndYear} web archive for ${country.name}.`,
        zh: `这是 ${archiveStartYear}-${archiveEndYear} 年网页档案中找到的最早一张可用${country.nameZh}护照封面实物图。`,
      }
    : {
        en: `The preserved cover image differs visibly from the preceding archive capture from ${previousEdition.record.timestamp.slice(0, 4)}. The archive alone cannot confirm whether this was an official redesign or a source-photo update.`,
        zh: `这张档案封面与 ${previousEdition.record.timestamp.slice(0, 4)} 年的上一张存档存在明显视觉差异；仅凭网页档案无法断定这是官方改版，还是来源照片更新。`,
      };

  return {
    year,
    period: `archive-${edition.record.timestamp}`,
    dateType: "archive-observed",
    observedAt: observedDate,
    title: {
      en: firstObservation ? `${year} archive baseline` : `${year} observed cover change`,
      zh: firstObservation ? `${year} 年档案基线` : `${year} 年观察到封面变化`,
    },
    description: {
      en: `A real passport-cover image preserved by the Internet Archive on ${observedDate.slice(0, 10)}. This is a web-capture date, not a claimed official issue date.`,
      zh: `Internet Archive 于 ${observedDate.slice(0, 10)} 保存的真实护照封面图片。该日期是网页存档日期，并非推定的官方发行日期。`,
    },
    cover: "",
    sourceUrl: archiveReplayUrl(edition.record),
    evidenceUrl: `https://web.archive.org/cdx/search/cdx?url=www.passportindex.org/countries/${country.iso2.toLowerCase()}.png&output=json&fl=timestamp,digest,statuscode,mimetype,original&filter=statuscode:200`,
    license: "Source attribution; image rights retained by Passport Index",
    author: "Passport Index / Internet Archive",
    changeConfidence: firstObservation ? "archive-baseline" : "observed-image-change",
    changes: [{ category: "design", detail: changeDetail }],
  };
}

async function currentEntry(country, previousEdition) {
  const currentPath = path.join(root, "public", country.passportCover.replace(/^\//, ""));
  const currentSignature = await imageSignature(currentPath);
  const currentDistance = imageDistance(previousEdition?.signature, currentSignature);
  const visiblyChanged = Boolean(previousEdition) && currentDistance >= visualChangeThreshold;
  const previousYear = previousEdition?.record.timestamp.slice(0, 4);

  return {
    year: 2026,
    period: "Current reference",
    dateType: "current-reference",
    observedAt: "2026-09-01T00:00:00Z",
    title: { en: "Current passport reference cover", zh: "当前护照参考封面" },
    description: {
      en: "The current real cover reference used by Passport Atlas. Passport appearance can vary by issue year and passport class.",
      zh: "Passport Atlas 当前采用的真实护照封面参考图；不同签发年份和护照类别的外观可能存在差异。",
    },
    cover: country.passportCover,
    sourceUrl: country.passportCoverSource,
    evidenceUrl: country.passportCoverSource,
    license: country.passportCoverLicense || "Passport Index source",
    author: "Passport Index",
    isCurrent: true,
    changeConfidence: visiblyChanged ? "observed-image-change" : "no-confirmed-change",
    changes: [{
      category: "design",
      detail: visiblyChanged
        ? {
            en: `The current source cover differs visibly from the latest retained archive image from ${previousYear}; the exact official redesign date still requires an issuing-authority source.`,
            zh: `当前来源封面与保留的最近一张 ${previousYear} 年档案图存在明显差异；准确的官方改版日期仍需签发机关资料确认。`,
          }
        : {
            en: `No visually significant cover change can be confirmed between the latest retained archive image${previousYear ? ` from ${previousYear}` : ""} and the current source image.`,
            zh: `在保留的最近一张${previousYear ? ` ${previousYear} 年` : ""}档案图与当前来源图之间，暂未确认到明显的封面变化。`,
          },
    }],
  };
}

async function writeArchiveCover(country, edition, entry) {
  const directory = path.join(root, "public", "passports-history", country.iso3.toLowerCase());
  const filename = `archive-${edition.record.timestamp.slice(0, 8)}.webp`;
  const target = path.join(directory, filename);
  await mkdir(directory, { recursive: true });
  await sharp(edition.buffer)
    .rotate()
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 90, effort: 5 })
    .toFile(target);
  entry.cover = `/passports-history/${country.iso3.toLowerCase()}/${filename}`;
}

const countries = JSON.parse(await readFile(path.join(root, "data", "countries.json"), "utf8"));
const existingHistoryPath = path.join(root, "data", "passport-history-sources.json");
const existingHistory = JSON.parse(await readFile(existingHistoryPath, "utf8"));
const cdxResponse = await fetchWithRetry(cdxUrl);
const cdxRows = await cdxResponse.json();
const [headers, ...rows] = cdxRows;
const columns = Object.fromEntries(headers.map((header, index) => [header, index]));
const recordsByIso2 = new Map();

for (const row of rows) {
  const original = row[columns.original];
  const iso2 = exactCountryCode(original);
  if (!iso2) continue;
  const record = {
    timestamp: row[columns.timestamp],
    digest: row[columns.digest],
    original,
  };
  if (!recordsByIso2.has(iso2)) recordsByIso2.set(iso2, []);
  recordsByIso2.get(iso2).push(record);
}

for (const records of recordsByIso2.values()) {
  records.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

const outputHistory = { CHN: existingHistory.CHN };
const missingArchives = [];
let archiveEditionCount = 0;

for (let index = 0; index < countries.length; index += 3) {
  const group = countries.slice(index, index + 3);
  const processed = await Promise.all(group.map(async (country) => {
    if (country.iso3 === "CHN") return { country, entries: existingHistory.CHN, archiveCount: 0 };
    const records = recordsByIso2.get(country.iso2) ?? [];
    if (records.length === 0) {
      missingArchives.push(country.iso3);
      return { country, entries: [await currentEntry(country)], archiveCount: 0 };
    }

    const editions = await selectArchiveEditions(country, records);
    if (editions.length === 0) missingArchives.push(country.iso3);
    const entries = editions.map((edition, editionIndex) => archiveEntry(country, edition, editionIndex, editions[editionIndex - 1]));
    for (let editionIndex = 0; editionIndex < editions.length; editionIndex += 1) {
      if (shouldWrite) await writeArchiveCover(country, editions[editionIndex], entries[editionIndex]);
      else entries[editionIndex].cover = `[archive image ${editions[editionIndex].record.timestamp}]`;
    }
    entries.push(await currentEntry(country, editions.at(-1)));
    return { country, entries, archiveCount: editions.length };
  }));

  for (const result of processed) {
    outputHistory[result.country.iso3] = result.entries;
    archiveEditionCount += result.archiveCount;
  }
  console.log(`Processed ${Math.min(index + group.length, countries.length)}/${countries.length} countries`);
}

const coverage = Object.keys(outputHistory).length;
const editionCount = Object.values(outputHistory).reduce((total, entries) => total + entries.length, 0);
console.log(`Country coverage: ${coverage}/${countries.length}`);
console.log(`Retained ${archiveEditionCount} visually distinct Wayback images; ${editionCount} total timeline entries.`);
if (missingArchives.length) console.warn(`No usable archive image: ${missingArchives.join(", ")}`);

if (shouldWrite) {
  await writeFile(existingHistoryPath, `${JSON.stringify(outputHistory, null, 2)}\n`, "utf8");
  console.log(`Wrote ${existingHistoryPath}`);
} else {
  console.log("Dry run only. Re-run with --write to save assets and data.");
}
