import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const shouldWrite = process.argv.includes("--write");
const userAgent = "PassportAtlas/1.0 (https://github.com/p1ter111/passport)";
const wikipediaApi = "https://en.wikipedia.org/w/api.php";
const wikidataApi = "https://www.wikidata.org/w/api.php";
const commonsApi = "https://commons.wikimedia.org/w/api.php";
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function postApi(url, parameters, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": userAgent,
      },
      body: new URLSearchParams({ format: "json", origin: "*", ...parameters }),
    });
    if (response.ok) return response.json();
    if (attempt === attempts) throw new Error(`${url} returned ${response.status}`);
    await wait(700 * attempt);
  }
}

function batches(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function claimEntityId(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.id;
}

function claimString(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
}

function stripWikiMarkup(value) {
  return value
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPeriod(caption, filename) {
  const source = `${caption} ${filename}`;
  const range = source.match(/\b((?:18|19|20)\d{2})\s*(?:-|–|—|to|until|and)\s*((?:18|19|20)\d{2})\b/i);
  if (range) return { year: Number(range[1]), period: `${range[1]}-${range[2]}` };

  const captionYear = caption.match(/\b((?:18|19|20)\d{2})s?\b/);
  const filenameYear = filename.match(/\b((?:18|19|20)\d{2})s?\b/);
  const match = captionYear ?? filenameYear;
  if (!match) return null;
  return { year: Number(match[1]), period: match[0].endsWith("s") ? `${match[1]}s` : match[1] };
}

function candidateScore(filename, caption) {
  const value = `${filename} ${caption}`.toLowerCase();
  let score = 0;
  if (value.includes("front cover")) score += 8;
  if (value.includes("cover")) score += 5;
  if (value.includes("ordinary")) score += 4;
  if (value.includes("old") || value.includes("historic") || value.includes("previous")) score += 3;
  if (value.includes("issued")) score += 2;
  if (value.includes("machine-readable") || value.includes("biometric")) score += 2;
  return score;
}

function extractCandidates(wikitext) {
  const candidates = [];
  const filePattern = /(?:\[\[)?File:([^|\]\n]+?\.(?:jpe?g|png|webp))\s*(?:\|([^\]\n]*))?(?:\]\])?$/gim;
  const excluded = /visa requirement|visa page|data page|personal information|information page|inside page|interior|amendment|endorsement|stamp|usage tips|message|note page|identity page|biodata|refugee|alien'?s|diplomatic|service passport|official passport|seafarer|public affairs|emergency|travel document|specimen|world map|book page/i;
  const currentOnly = /\bcurrent\b|contemporary|present design|issued since|since (?:18|19|20)\d{2}/i;

  for (const match of wikitext.matchAll(filePattern)) {
    const filename = match[1].trim();
    const rawCaption = match[2] ?? "";
    const captionParts = rawCaption.split("|");
    const caption = stripWikiMarkup(captionParts.at(-1) ?? rawCaption);
    const combined = `${filename} ${caption}`;
    if (!/passport/i.test(combined) || excluded.test(combined) || currentOnly.test(caption)) continue;

    const period = extractPeriod(caption, filename);
    if (!period || period.year > 2024) continue;
    if (!/(?:18|19|20)\d{2}|old|historic|former|previous|version|series|non-machine-readable|pre-biometric/i.test(combined)) continue;

    candidates.push({
      filename,
      fileTitle: `File:${filename}`,
      caption: caption || `${period.period} passport archive photograph`,
      ...period,
      score: candidateScore(filename, caption),
    });
  }

  const byYear = new Map();
  for (const candidate of candidates.sort((left, right) => right.score - left.score)) {
    if (!byYear.has(candidate.year)) byYear.set(candidate.year, candidate);
  }
  return [...byYear.values()].sort((left, right) => left.year - right.year).slice(-6);
}

async function getPassportPages() {
  const response = await postApi(wikipediaApi, {
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:Passports by country",
    cmnamespace: "0",
    cmlimit: "500",
  });
  return response.query.categorymembers.map((member) => member.title);
}

async function getPageRecords(titles) {
  const records = [];
  for (const group of batches(titles, 20)) {
    const response = await postApi(wikipediaApi, {
      action: "query",
      prop: "pageprops|revisions",
      ppprop: "wikibase_item",
      rvprop: "content",
      rvslots: "main",
      titles: group.join("|"),
      formatversion: "2",
    });
    for (const page of response.query.pages) {
      records.push({
        title: page.title,
        qid: page.pageprops?.wikibase_item,
        wikitext: page.revisions?.[0]?.slots?.main?.content ?? "",
      });
    }
    await wait(180);
  }
  return records.filter((record) => record.qid);
}

async function getEntities(ids, properties = "claims") {
  const entities = {};
  for (const group of batches([...new Set(ids)], 40)) {
    const response = await postApi(wikidataApi, {
      action: "wbgetentities",
      ids: group.join("|"),
      props: properties,
    });
    Object.assign(entities, response.entities);
    await wait(180);
  }
  return entities;
}

async function getCommonsMetadata(fileTitles) {
  const metadata = {};
  for (const group of batches([...new Set(fileTitles)], 20)) {
    const response = await postApi(commonsApi, {
      action: "query",
      titles: group.join("|"),
      prop: "imageinfo",
      iiprop: "url|size|mime|extmetadata",
      iiurlwidth: "1000",
      formatversion: "2",
    });
    for (const page of response.query.pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      metadata[page.title] = {
        url: info.thumburl ?? info.url,
        sourceUrl: info.descriptionurl,
        mime: info.mime,
        width: info.width,
        height: info.height,
        license: stripWikiMarkup(info.extmetadata?.LicenseShortName?.value ?? ""),
        author: stripWikiMarkup(info.extmetadata?.Artist?.value ?? "Wikimedia Commons contributor"),
      };
    }
    await wait(220);
  }
  return metadata;
}

function isReusableImage(metadata) {
  if (!metadata || !["image/jpeg", "image/png", "image/webp"].includes(metadata.mime)) return false;
  return /public domain|cc0|cc by|cc-by|cc-by-sa|cc by-sa/i.test(metadata.license);
}

function buildChanges(candidate) {
  const changes = [{
    category: "design",
    detail: {
      en: `Archive identification: ${candidate.caption}`,
      zh: `档案来源将这张实物封面标注为 ${candidate.period} 年版本。`,
    },
  }];
  const caption = candidate.caption.toLowerCase();
  if (caption.includes("non-machine-readable")) {
    changes.push({ category: "standards", detail: { en: "The archive identifies this as a non-machine-readable edition.", zh: "档案资料明确将该版本标注为非机读护照。" } });
  } else if (caption.includes("machine-readable")) {
    changes.push({ category: "standards", detail: { en: "The archive identifies this as a machine-readable edition.", zh: "档案资料明确将该版本标注为机读护照。" } });
  }
  if (caption.includes("biometric")) {
    changes.push({ category: "security", detail: { en: "The archive identifies this edition as a biometric passport.", zh: "档案资料明确将该版本标注为生物识别护照。" } });
  }
  return changes;
}

async function downloadFile(url, target) {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

const countries = JSON.parse(await readFile(path.join(root, "data/countries.json"), "utf8"));
const countryByIso3 = new Map(countries.map((country) => [country.iso3, country]));
const existingHistoryPath = path.join(root, "data/passport-history-sources.json");
const existingHistory = JSON.parse(await readFile(existingHistoryPath, "utf8"));

const pageTitles = await getPassportPages();
const pageRecords = await getPageRecords(pageTitles);
const passportEntities = await getEntities(pageRecords.map((record) => record.qid));
const countryQids = Object.values(passportEntities).map((entity) => claimEntityId(entity, "P17")).filter(Boolean);
const countryEntities = await getEntities(countryQids);
const countryIsoByQid = new Map(Object.values(countryEntities).map((entity) => [entity.id, claimString(entity, "P298")]).filter(([, iso3]) => iso3));

const discovered = [];
for (const record of pageRecords) {
  const countryQid = claimEntityId(passportEntities[record.qid], "P17");
  const iso3 = countryIsoByQid.get(countryQid);
  if (!iso3 || !countryByIso3.has(iso3) || iso3 === "CHN") continue;
  for (const candidate of extractCandidates(record.wikitext)) discovered.push({ ...candidate, iso3, articleTitle: record.title });
}

const commonsMetadata = await getCommonsMetadata(discovered.map((candidate) => candidate.fileTitle));
const accepted = discovered.filter((candidate) => isReusableImage(commonsMetadata[candidate.fileTitle]));
const acceptedCountries = new Set(accepted.map((candidate) => candidate.iso3));

console.log(`Passport articles: ${pageRecords.length}`);
console.log(`Historical image candidates: ${discovered.length}`);
console.log(`Reusable verified images: ${accepted.length}`);
console.log(`Country coverage: ${acceptedCountries.size}/${countries.length}`);

if (!shouldWrite) {
  const summary = [...acceptedCountries].sort().map((iso3) => ({
    iso3,
    country: countryByIso3.get(iso3)?.name,
    editions: accepted.filter((candidate) => candidate.iso3 === iso3).map((candidate) => `${candidate.period}: ${candidate.filename}`),
  }));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

for (const candidate of accepted) {
  const metadata = commonsMetadata[candidate.fileTitle];
  const extension = metadata.mime === "image/png" ? "png" : metadata.mime === "image/webp" ? "webp" : "jpg";
  const directory = path.join(root, "public/passports-history", candidate.iso3.toLowerCase());
  const filename = `${candidate.year}.${extension}`;
  await mkdir(directory, { recursive: true });
  await downloadFile(metadata.url, path.join(directory, filename));

  const country = countryByIso3.get(candidate.iso3);
  const entry = {
    year: candidate.year,
    period: candidate.period,
    title: { en: `${candidate.period} ${country.name} passport`, zh: `${candidate.period} 年普通护照` },
    description: {
      en: candidate.caption,
      zh: `这张真实档案图片记录了 ${candidate.period} 年签发或使用的普通护照版本。`,
    },
    cover: `/passports-history/${candidate.iso3.toLowerCase()}/${filename}`,
    sourceUrl: metadata.sourceUrl,
    evidenceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(candidate.articleTitle.replaceAll(" ", "_"))}`,
    license: metadata.license,
    author: metadata.author || "Wikimedia Commons contributor",
    changes: buildChanges(candidate),
  };
  existingHistory[candidate.iso3] ??= [];
  existingHistory[candidate.iso3] = existingHistory[candidate.iso3].filter((item) => item.year !== candidate.year);
  existingHistory[candidate.iso3].push(entry);
  existingHistory[candidate.iso3].sort((left, right) => left.year - right.year);
  await wait(80);
}

await writeFile(existingHistoryPath, `${JSON.stringify(existingHistory, null, 2)}\n`);
console.log(`Wrote ${accepted.length} verified historical images across ${acceptedCountries.size} countries.`);
