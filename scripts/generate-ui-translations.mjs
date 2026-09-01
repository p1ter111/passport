import fs from "node:fs/promises";
import path from "node:path";
import { languages } from "countries-list";

const outputPath = path.join(process.cwd(), "data", "ui-translations.json");
const manualCodes = new Set(["zh", "zh-TW", "en", "es", "fr", "de", "ja", "ko", "ar", "ru", "pt", "tr", "hi"]);
const existingData = await fs.readFile(outputPath, "utf8").then(JSON.parse).catch(() => ({ translations: {} }));
const targetAliases = {
  an: "es", bi: "fr", cr: "fr", cu: "ru", ho: "fr", hz: "af", ia: "it", ie: "it",
  ii: "zh-CN", ik: "es", io: "es", ki: "sw", kj: "af", ks: "ur", kw: "cy", lu: "sw",
  na: "fr", nd: "zu", ng: "af", nn: "no", nv: "es", oj: "fr", pi: "hi", rm: "it",
  sc: "it", vo: "de", wa: "fr", za: "zh-CN", zh: "zh-CN",
};

const sourceLines = [
  ["badge", "AI Passport Travel Assistant"],
  ["titleTop", "Explore your passport,"],
  ["titleBottom", "connect the world"],
  ["welcome", "Welcome to Passport Atlas"],
  ["body0", "Understand where your passport can take you,"],
  ["body1", "what entry rules apply,"],
  ["body2", "and how to prepare for your next journey."],
  ["action", "Start exploring"],
  ["trust", "Public data from authoritative sources, continuously updated"],
  ["language", "Language"],
  ["search", "Search languages"],
  ["count", "national languages"],
  ["feature0t", "Global coverage"],
  ["feature0d", "199 countries and regions"],
  ["feature1t", "Trusted data"],
  ["feature1d", "Continuously updated"],
  ["feature2t", "Smart guidance"],
  ["feature2d", "AI-assisted trip planning"],
  ["feature3t", "Privacy first"],
  ["feature3d", "Your information stays protected"],
  ["routePlan", "Plan my journey"],
  ["routeExplore", "Explore passports"],
  ["routeOrigin", "Which passport do you hold?"],
  ["routeOriginHint", "Select your passport country"],
  ["routeDestination", "Where do you want to go?"],
  ["routeDestinationHint", "Select your destination"],
  ["routePlaceholder", "Choose a country or region"],
  ["routeSubmit", "See my visa plan"],
];

const entryLines = [
  ["entryHello", "Hello!"],
  ["entryFrom", "I'm from"],
  ["entryPrivacy", "Your privacy is important to us."],
  ["entrySelectCountry", "Select your country or region"],
  ["entrySearchCountries", "Search countries"],
  ["entryCountries", "countries and regions"],
];

const appLines = [
  ["explore", "Explore"], ["rankings", "Rankings"], ["compare", "Compare"], ["insights", "Insights"],
  ["appSearch", "Search"], ["login", "Login"], ["mainNavigation", "Main navigation"],
  ["mobileNavigation", "Mobile navigation"], ["closeNavigation", "Close navigation"], ["openNavigation", "Open navigation"],
  ["heroTop", "One passport"], ["heroBottom", "connects the world"],
  ["heroBody", "Explore global travel freedom in real time, and discover your next journey."],
  ["searchPlaceholder", "Search countries or passports, e.g. Japan"], ["countries", "Countries and regions"],
  ["passports", "Passports"], ["destinations", "Visa-free destinations"], ["flat", "Map"],
  ["high", "High access"], ["moderate", "Moderate"], ["limited", "Limited"], ["restricted", "Restricted"],
  ["strength", "Passport strength"], ["globalRank", "Global rank"], ["visaFree", "Visa-free access"],
  ["visaOnArrival", "Visa on arrival"], ["eta", "Electronic travel authorization"], ["eVisa", "E-visa"],
  ["visaRequired", "Visa required"], ["noAdmission", "No admission"], ["details", "Explore passport"],
  ["travelFreedom", "Travel freedom"], ["travelPlanner", "Travel planner"],
  ["disclaimer", "Visa and entry policies can change. Verify all requirements with official destination sources before travel."],
  ["compareTitle", "Compare passports"], ["close", "Close"], ["tripCheck", "Trip check"],
  ["plannerTitle", "Travel planner"], ["myPassport", "My passport"], ["destination", "Destination"],
  ["verifyPolicy", "Verify the latest official policy"],
  ["officialSource", "Use the destination government's latest entry information as the source of truth."],
  ["signIn", "Sign in to Passport Atlas"], ["email", "Email"], ["continue", "Continue"],
  ["pending", "Data update in progress"], ["noResult", "No passport was found. Try another country name."],
  ["emptySearch", "Enter a country name."], ["loadingMap", "Loading world map..."], ["loadingGlobe", "Building the 3D globe..."],
  ["globalMobilityIntelligence", "Global mobility intelligence"], ["globalFreedomMap", "Global freedom map"],
  ["mobilityIndex", "2026 Mobility Index"], ["platformOverview", "Platform data overview"],
  ["mapDisplayMode", "Map display mode"], ["passportFreedomLegend", "Passport freedom legend"],
  ["viewDetails", "View details"], ["compareKicker", "Passport comparison"], ["comparisonResults", "Passport comparison results"],
  ["shortStayVisaFree", "Visa-free short stay"], ["accountReady", "Account flow ready"],
  ["accountDescription", "Connect an authentication service to send a sign-in link."],
  ["demoNotice", "Example results are for product demonstration only. Verify with the destination embassy or official immigration authority before travel."],
  ["rankingHero", "Passport rankings"], ["rankingIntro", "Compare global passport access, visa-free destinations, and travel freedom."],
  ["leadingRank", "Leading rank"], ["averageFreedom", "Average freedom"],
  ["region", "Region"], ["allRegions", "All regions"], ["results", "passports"],
  ["updated", "Henley July 2026 access data"], ["rank", "Rank"], ["passport", "Passport"],
  ["freedom", "Freedom"], ["destinationCount", "destinations"], ["empty", "No passports found"],
  ["emptyHint", "Try another country name or region."], ["backToMap", "Back to map"],
  ["globalMobilityDatabase", "Global mobility database"], ["rankingOverview", "Ranking data overview"],
  ["globalPassportRanking", "Global passport ranking"], ["clearSearch", "Clear search"],
  ["sortRanking", "Ranking sort options"], ["view", "View"],
  ["home", "Home"], ["compareTool", "Comparison tool"], ["backWorldMap", "Back to world map"],
  ["passportTitle", "{country} passport"],
  ["passportIntro", "Explore the {country} passport, entry access, and visa requirements for destinations around the world."],
  ["coverReference", "Passport cover reference"], ["editionsVary", "Editions can vary by issue year"],
  ["henleyStamp", "Henley ranking: July 2026"], ["matrixStamp", "Visa matrix updated 17 February 2026"],
  ["globalPassportRank", "Global passport rank"], ["accessible", "Visa-free access"],
  ["onArrival", "On arrival"], ["matrixAccess", "Matrix access"], ["globalAccess", "Global access"],
  ["passportAccessMap", "{country} passport access map"],
  ["mapIntro", "The passport country is marked in dark gray; other destinations are colored by entry policy."],
  ["switchPassport", "Switch passport"], ["visaLegend", "Visa status legend"],
  ["passportCountry", "Passport country"], ["allDestinations", "All destinations"], ["noData", "No data"],
  ["passportCountryTitle", "{country} passport country"], ["routeTitle", "{origin} to {destination}"],
  ["originDescription", "This is the passport's issuing country or region."],
  ["visaFreeDays", "Visa-free stay up to {days} days"],
  ["visaFreeDescription", "Visa-free entry; verify the permitted stay with official policy."],
  ["arrivalDays", "Apply on arrival, usually for up to {days} days"], ["arrivalDescription", "Apply for a visa at the port of entry."],
  ["etaDescription", "Complete an electronic travel authorization before departure."],
  ["eVisaDescription", "Apply online for an electronic visa before departure."],
  ["visaRequiredDescription", "Apply through the embassy or official visa center before departure."],
  ["noAdmissionDescription", "Ordinary passport holders may currently be unable to enter."],
  ["unknownDescription", "Visa policy data for this destination needs official verification."],
  ["days", "days"],
  ["policyNotice", "Rules can change with diplomatic policy, travel purpose, and stay length. Verify official requirements before booking."],
  ["destinationKicker", "Destinations"], ["destinationVisaList", "Destination visa list"],
  ["searchDestinations", "Search destinations"], ["filterVisaStatus", "Filter by visa status"],
  ["destinationVisaInfo", "Destination visa information"], ["emptyDestinations", "No matching destinations"],
  ["sourceNote", "Source: passport-index-data (MIT). Visa policy is for reference only; verify with official destination sources."],
  ["backHome", "Back to home"], ["regionAsia", "Asia"], ["regionEurope", "Europe"],
  ["regionAfrica", "Africa"], ["regionNorthAmerica", "North America"], ["regionSouthAmerica", "South America"],
  ["regionOceania", "Oceania"], ["changeRoute", "Change route"], ["chooseRoute", "Choose route"],
  ["visaAndTrip", "Visa and trip"], ["getReady", "Get ready"], ["yourTravelPlan", "Your travel plan"],
  ["fromTo", "From {origin} to {destination}"],
  ["tripIntro", "Check entry rules first, then organize your stay and departure documents."],
  ["stayRules", "Stay rules"], ["step", "Step"], ["howManyDays", "How many days will you stay?"],
  ["stayAffects", "Your stay length can affect entry conditions."], ["departureDate", "Departure date"],
  ["travelChecklist", "Travel checklist"], ["preparation", "{status} preparation"],
  ["openSteps", "Open each step for guidance and check it off when complete."],
  ["markComplete", "Mark as complete"], ["undoComplete", "Complete, click to undo"],
  ["generatePlan", "Generate my action plan"], ["planReady", "Action plan ready, view below"],
  ["yourActionPlan", "Your action plan"], ["nextStepsReady", "Your next steps are ready"],
  ["route", "Route"], ["entryMethod", "Entry method"], ["plannedStay", "Planned stay"],
  ["departure", "Departure"], ["toBeSet", "To be set"], ["printChecklist", "Print or save checklist"],
  ["viewAccessMap", "View passport access map"], ["planAnotherTrip", "Plan another trip"],
];

const allLines = [...sourceLines, ...entryLines, ...appLines];

function toCopy(values) {
  const get = (key) => values[key] || allLines.find(([sourceKey]) => sourceKey === key)?.[1] || "";
  return {
    badge: get("badge"),
    titleTop: get("titleTop"),
    titleBottom: get("titleBottom"),
    welcome: get("welcome"),
    body: [get("body0"), get("body1"), get("body2")],
    action: get("action"),
    trust: get("trust"),
    language: get("language"),
    search: get("search"),
    count: get("count"),
    features: [0, 1, 2, 3].map((index) => [get(`feature${index}t`), get(`feature${index}d`)]),
    route: {
      planMode: get("routePlan"),
      exploreMode: get("routeExplore"),
      originQuestion: get("routeOrigin"),
      originHint: get("routeOriginHint"),
      destinationQuestion: get("routeDestination"),
      destinationHint: get("routeDestinationHint"),
      placeholder: get("routePlaceholder"),
      submit: get("routeSubmit"),
    },
    entry: {
      hello: get("entryHello"), from: get("entryFrom"), privacy: get("entryPrivacy"),
      selectCountry: get("entrySelectCountry"), searchCountries: get("entrySearchCountries"), countries: get("entryCountries"),
    },
    app: Object.fromEntries(appLines.map(([key]) => [key === "appSearch" ? "search" : key, get(key)])),
  };
}

async function translate(code) {
  const translated = {};
  const target = targetAliases[code] || code;
  for (let index = 0; index < allLines.length; index += 16) {
    const chunk = allLines.slice(index, index + 16);
    const source = chunk.map(([, value]) => value).join("\n");
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(source)}`;
    const response = await fetch(url, { headers: { "user-agent": "PassportAtlas/0.1" } });
    if (!response.ok) throw new Error(`translation request failed: ${response.status}`);
    const payload = await response.json();
    const lines = Array.isArray(payload?.[0]) ? payload[0].map((segment) => String(segment?.[0] ?? "").replace(/\n/g, "").trim()).filter(Boolean) : [];
    if (lines.length !== chunk.length) throw new Error(`expected ${chunk.length} lines, got ${lines.length}`);
    chunk.forEach(([key], lineIndex) => { translated[key] = lines[lineIndex]; });
  }
  return toCopy(translated);
}

const entries = [...Object.keys(languages), "zh-TW"].filter((code) => !manualCodes.has(code));
const translations = {};
const failures = [];

for (let index = 0; index < entries.length; index += 6) {
  const batch = entries.slice(index, index + 6);
  const results = await Promise.all(batch.map(async (code) => {
    try {
      return [code, await translate(code)];
    } catch (error) {
      failures.push(`${code}: ${error instanceof Error ? error.message : String(error)}`);
      return [code, existingData.translations?.[code] ?? toCopy({})];
    }
  }));
  for (const [code, copy] of results) translations[code] = copy;
  console.log(`translated ${Math.min(index + batch.length, entries.length)}/${entries.length}`);
}

await fs.writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: toCopy({}), translations, failures }, null, 2)}\n`, "utf8");
console.log(`wrote ${Object.keys(translations).length} language packs to ${outputPath}`);
if (failures.length) console.warn(`${failures.length} language packs used English fallback`);
