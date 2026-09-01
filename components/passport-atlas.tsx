"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Globe2,
  Map as MapIcon,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import { PassportCover } from "./passport-cover";
import { useSiteLanguage, type SiteLocale } from "./site-language";
import { formatCopy, getAppCopy, getCountryName, getRegionName, toTraditionalDeep } from "@/lib/i18n";

const WorldMap = dynamic(
  () => import("./world-map").then((module) => module.WorldMap),
  {
    ssr: false,
    loading: () => <AtlasMapLoading />,
  },
);

const GlobeMap = dynamic(
  () => import("./globe-map").then((module) => module.GlobeMap),
  {
    ssr: false,
    loading: () => <AtlasMapLoading globe />,
  },
);

const countries = countriesData as CountryProfile[];
const alphabeticalCountries = [...countries].sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
const supportedPassportEditions = 227;

const strengthColors = {
  high: "#a9d6b5",
  medium: "#dce4a5",
  limited: "#f0d29b",
  low: "#e8b1a8",
  unavailable: "#e7ecf2",
};

const atlasCopy = {
  en: {
    explore: "Explore", rankings: "Rankings", compare: "Compare", insights: "Insights", search: "Search", login: "Login",
    heroTop: "One passport", heroBottom: "connects the world", heroBody: "Explore global travel freedom in real time,\nand discover your next journey.",
    searchPlaceholder: "Search countries or passports, e.g. Japan", countries: "Countries", passports: "Passports", destinations: "Visa-free access",
    flat: "Map", globe: "3D", high: "High access", moderate: "Moderate", limited: "Limited", restricted: "Restricted",
    strength: "Passport Strength", globalRank: "Global rank", visaFree: "Visa-free access", visaRequired: "Visa Required", details: "Explore Passport",
    travelPlanner: "Travel planner", disclaimer: "Visa and entry policies can change. Verify all requirements with official destination sources before travel.",
    compareTitle: "Compare passports", ranking: "Global rank", arrival: "Visa on arrival", close: "Close",
    tripCheck: "TRIP CHECK", plannerTitle: "Travel planner", myPassport: "My passport", destination: "Destination",
    verifyPolicy: "Verify latest official policy", officialSource: "Use the destination government's latest entry information as the source of truth.",
    signIn: "Sign in to Passport Atlas", email: "Email", continue: "Continue", pending: "Data update in progress",
    noResult: "No passport found. Try a country name in English or Chinese.", emptySearch: "Enter a country name.",
  },
  zh: {
    explore: "探索", rankings: "护照排名", compare: "对比", insights: "数据洞察", search: "搜索", login: "登录",
    heroTop: "一本护照", heroBottom: "连接世界", heroBody: "实时探索全球旅行自由度，\n发现你的下一段旅程。",
    searchPlaceholder: "搜索国家或护照，例如：日本", countries: "国家和地区", passports: "本护照", destinations: "免预签目的地",
    flat: "平面", globe: "3D", high: "高自由度", moderate: "较高", limited: "中等", restricted: "受限制",
    strength: "护照实力", globalRank: "全球排名", visaFree: "免预签通行", visaRequired: "需要签证", details: "查看护照",
    travelPlanner: "旅行规划", disclaimer: "签证和入境政策可能随时调整，出行前请以目的地官方信息为准。",
    compareTitle: "护照对比", ranking: "全球排名", arrival: "落地签", close: "关闭",
    tripCheck: "旅行核验", plannerTitle: "旅行规划", myPassport: "我的护照", destination: "目的地",
    verifyPolicy: "需要核验最新政策", officialSource: "请以目的地政府发布的最新入境信息为准。",
    signIn: "登录 Passport Atlas", email: "邮箱", continue: "继续", pending: "资料更新中",
    noResult: "暂未找到该护照，请尝试国家中文名或英文名。", emptySearch: "请输入国家名称。",
  },
} as const;

function AtlasMapLoading({ globe = false }: { globe?: boolean }) {
  const locale = useSiteLanguage();
  const copy = getAtlasCopy(locale);
  return <div className={globe ? "globe-loading" : "map-loading"}>{globe ? copy.loadingGlobe : copy.loadingMap}</div>;
}

function getAtlasCopy(locale: string): Record<string, string> {
  const chineseCopy = locale === "zh" ? atlasCopy.zh : locale === "zh-TW" ? toTraditionalDeep(atlasCopy.zh) : {};
  return { ...atlasCopy.en, ...getAppCopy(locale), ...chineseCopy };
}

type MapHoverPoint = { x: number; y: number };
type HoveredCountry = MapHoverPoint & { country: CountryProfile };

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function searchPriority(country: CountryProfile, query: string) {
  const primary = [country.name, country.nameZh, country.iso2, country.iso3].map((value) => value.toLocaleLowerCase());
  const aliases = country.aliases.map((value) => value.toLocaleLowerCase());
  if (primary.includes(query)) return 0;
  if (aliases.includes(query)) return 1;
  if ([...primary, ...aliases].some((value) => value.startsWith(query))) return 2;
  return 3;
}

function colorForScore(score: number) {
  if (score >= 85) return strengthColors.high;
  if (score >= 65) return strengthColors.medium;
  if (score >= 45) return strengthColors.limited;
  return strengthColors.low;
}

function createUnavailableCountry(name: string, numericId: string): CountryProfile {
  return {
    name,
    nameZh: name,
    nativeName: name,
    flag: "🌐",
    iso2: "--",
    iso3: "---",
    numericId,
    passportRank: 0,
    visaFreeCountries: 0,
    visaOnArrivalCountries: 0,
    etaCountries: 0,
    eVisaCountries: 0,
    visaRequiredCountries: 0,
    noAdmissionCountries: 0,
    accessibleCountries: 0,
    freedomScore: 0,
    region: "亚洲",
    passportColor: "#34465b",
    passportCover: "",
    intro: "该国家的完整护照资料正在接入。地图选择已生效，后续可连接实时签证数据源。",
    aliases: [],
    dataReady: false,
  };
}

export function PassportAtlas() {
  const router = useRouter();
  const locale = useSiteLanguage();
  const copy = getAtlasCopy(locale);
  const [selected, setSelected] = useState<CountryProfile>(countries[0]);
  const [peekOpen, setPeekOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"map" | "globe">("map");
  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const totalVisaFreeDestinations = useMemo(
    () => countries.reduce((sum, country) => sum + country.accessibleCountries, 0),
    [],
  );

  const byNumericId = useMemo(
    () => new Map(countries.map((country) => [country.numericId, country])),
    [],
  );

  const suggestions = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return [];
    return countries
      .filter((country) =>
        [country.name, country.nameZh, country.iso3, ...country.aliases]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized),
      )
      .sort((left, right) => searchPriority(left, normalized) - searchPriority(right, normalized) || left.passportRank - right.passportRank)
      .slice(0, 5);
  }, [query]);

  const selectCountry = (country: CountryProfile) => {
    setSelected(country);
    setPeekOpen(true);
    setQuery("");
    setSearchMessage("");
  };

  const openCountryProfile = (country: CountryProfile) => {
    router.push(`/passport/${country.iso3.toLowerCase()}`);
  };

  const handleMapCountry = (name: string, numericId: string) => {
    selectCountry(byNumericId.get(numericId) ?? createUnavailableCountry(name, numericId));
  };

  const handleMapHover = (name: string, numericId: string, point: MapHoverPoint | null) => {
    if (!point) {
      setHoveredCountry(null);
      return;
    }
    setHoveredCountry({
      country: byNumericId.get(numericId) ?? createUnavailableCountry(name, numericId),
      ...point,
    });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const match = suggestions[0];
    if (match) {
      openCountryProfile(match);
      return;
    }
    setSearchMessage(query.trim() ? copy.noResult : copy.emptySearch);
  };

  const openRankings = () => {
    router.push("/rankings");
    setMobileMenuOpen(false);
  };

  const focusSearch = () => {
    searchRef.current?.focus();
    setMobileMenuOpen(false);
  };

  const scrollToInsights = () => {
    document.querySelector("#insights")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setMobileMenuOpen(false);
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="brand-mark"><Globe2 size={22} strokeWidth={1.8} /></span>
          <span>Passport <strong>Atlas</strong></span>
        </button>

        <nav className="desktop-nav" aria-label={copy.mainNavigation}>
          <button className="nav-active" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{copy.explore}</button>
          <button type="button" onClick={openRankings}>{copy.rankings}</button>
          <button type="button" onClick={() => setCompareOpen(true)}>{copy.compare}</button>
          <button type="button" onClick={scrollToInsights}>{copy.insights}</button>
        </nav>

        <div className="header-actions">
          <button className="header-search" type="button" onClick={focusSearch}>
            <Search size={17} />
            <span>{copy.search}</span>
          </button>
          <Link className="icon-button header-library-link" href="/saved" aria-label={copy.myList} title={copy.myList}>
            <Bookmark size={17} />
          </Link>
          <button className="login-button" type="button" onClick={() => setAuthOpen(true)}>{copy.login}</button>
          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? copy.closeNavigation : copy.openNavigation}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label={copy.mobileNavigation}>
          <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }}>{copy.explore}</button>
          <button type="button" onClick={openRankings}>{copy.rankings}</button>
          <button type="button" onClick={() => { setCompareOpen(true); setMobileMenuOpen(false); }}>{copy.compare}</button>
          <button type="button" onClick={scrollToInsights}>{copy.insights}</button>
          <button type="button" onClick={focusSearch}>{copy.search}</button>
          <Link href="/saved" onClick={() => setMobileMenuOpen(false)}>{copy.myList}</Link>
          <button type="button" onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }}>{copy.login}</button>
        </nav>
      )}

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">{copy.globalMobilityIntelligence}</div>
          <h1 id="hero-title">{copy.heroTop}<br />{copy.heroBottom}</h1>
          <p>{copy.heroBody.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p>

          <form className="country-search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSearchMessage(""); }}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              autoComplete="off"
            />
            <button type="submit" aria-label={copy.search} title={copy.search}><ArrowRight size={20} /></button>
            {suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((country) => (
                  <button type="button" key={country.iso3} onClick={() => openCountryProfile(country)}>
                    <span>{country.flag}</span>
                    <span><strong>{getCountryName(country, locale)}</strong><small>{country.iso3}</small></span>
                    <span className="suggestion-rank">#{country.passportRank}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
          {searchMessage && <p className="search-message" role="status">{searchMessage}</p>}

          <div className="hero-metrics" id="insights" aria-label={copy.platformOverview}>
            <div><strong>{countries.length}</strong><span>{copy.countries}</span></div>
            <div><strong>{supportedPassportEditions}</strong><span>{copy.passports}</span></div>
            <div><strong>{totalVisaFreeDestinations.toLocaleString("en-US")}</strong><span>{copy.destinations}</span></div>
          </div>
        </div>

        <div className="map-stage">
          <div className="map-caption">
            <span>{copy.globalFreedomMap}</span>
            <strong>{copy.mobilityIndex}</strong>
          </div>
          <div className="map-mode-switch" role="group" aria-label={copy.mapDisplayMode}>
            <button className={mapMode === "map" ? "active" : ""} type="button" onClick={() => setMapMode("map")}>
              <MapIcon size={15} /> {copy.flat}
            </button>
            <button className={mapMode === "globe" ? "active" : ""} type="button" onClick={() => setMapMode("globe")}>
              <Globe2 size={15} /> 3D
            </button>
          </div>

          {mapMode === "map" ? (
            <WorldMap
              selectedId={selected.numericId}
              colorForCountry={(numericId) => {
                const country = byNumericId.get(numericId);
                return country ? colorForScore(country.freedomScore) : strengthColors.unavailable;
              }}
              onCountrySelect={handleMapCountry}
              onCountryHover={handleMapHover}
              locale={locale}
            />
          ) : (
            <GlobeMap
              selectedId={selected.numericId}
              colorForCountry={(numericId) => {
                const country = byNumericId.get(numericId);
                return country ? colorForScore(country.freedomScore) : strengthColors.unavailable;
              }}
              onCountrySelect={handleMapCountry}
              locale={locale}
            />
          )}

          {mapMode === "map" && hoveredCountry && hoveredCountry.country.dataReady !== false && (
            <MapHoverCard hovered={hoveredCountry} locale={locale} />
          )}

          {peekOpen && (
            <CountryPeek
              country={selected}
              locale={locale}
              onClose={() => setPeekOpen(false)}
              onDetails={() => selected.dataReady !== false && openCountryProfile(selected)}
            />
          )}

          <div className="map-legend" aria-label={copy.passportFreedomLegend}>
            <span><i style={{ background: strengthColors.high }} />{copy.high}</span>
            <span><i style={{ background: strengthColors.medium }} />{copy.moderate}</span>
            <span><i style={{ background: strengthColors.limited }} />{copy.limited}</span>
            <span><i style={{ background: strengthColors.low }} />{copy.restricted}</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span><Globe2 size={18} /> Passport Atlas</span>
        <p>{copy.disclaimer}</p>
        <span className="footer-actions">
          <button type="button" onClick={() => setPlannerOpen(true)}>{copy.travelPlanner}</button>
          <span>© 2026</span>
        </span>
      </footer>

      {compareOpen && (
        <ComparisonDialog initialRight={selected} locale={locale} onClose={() => setCompareOpen(false)} />
      )}
      {plannerOpen && <PlannerDialog locale={locale} onClose={() => setPlannerOpen(false)} />}
      {authOpen && <AuthDialog locale={locale} onClose={() => setAuthOpen(false)} />}
    </main>
  );
}

function CountryPeek({
  country,
  locale,
  onClose,
  onDetails,
}: {
  country: CountryProfile;
  locale: SiteLocale;
  onClose: () => void;
  onDetails: () => void;
}) {
  const ready = country.dataReady !== false;
  const copy = getAtlasCopy(locale);
  return (
    <aside className="country-peek" aria-live="polite">
      <button className="peek-close" type="button" onClick={onClose} aria-label={copy.close} title={copy.close}>
        <X size={16} />
      </button>
      <div className="peek-identity">
        <PassportCover color={country.passportColor} name={getCountryName(country, locale)} flag={country.flag} cover={country.passportCover} />
        <div className="peek-title">
          <span className="peek-flag">{country.flag}</span>
          <span><strong>{getCountryName(country, locale)}</strong><small>{country.iso3} · {country.iso2}</small></span>
        </div>
      </div>
      {ready ? (
        <div className="peek-data">
          <div className="peek-primary">
            <span>{copy.strength}</span>
            <strong>{country.freedomScore}%</strong>
            <small>{copy.globalRank} #{country.passportRank}</small>
          </div>
          <div className="peek-stats">
            <span><small>{copy.visaFree}</small><strong>{country.accessibleCountries}</strong></span>
            <span><small>{copy.visaRequired}</small><strong>{country.visaRequiredCountries}</strong></span>
          </div>
        </div>
      ) : (
        <div className="pending-data">{copy.pending}</div>
      )}
      <button className="peek-explore" type="button" onClick={onDetails} disabled={!ready}>
        {copy.details} <ArrowRight size={15} />
      </button>
    </aside>
  );
}

function MapHoverCard({ hovered, locale }: { hovered: HoveredCountry; locale: SiteLocale }) {
  const { country, x, y } = hovered;
  const copy = getAtlasCopy(locale);
  return (
    <aside
      className={`map-hover-card ${x > 68 ? "align-left" : "align-right"}`}
      style={{ left: `${x}%`, top: `${Math.min(78, Math.max(20, y))}%` }}
      aria-hidden="true"
    >
      <div className="hover-country"><span>{country.flag}</span><strong>{formatCopy(copy.passportTitle, { country: getCountryName(country, locale) })}</strong></div>
      <div className="hover-metrics">
        <span><small>{copy.globalRank}</small><strong>#{country.passportRank}</strong></span>
        <span><small>{copy.visaFree}</small><strong>{country.accessibleCountries}</strong></span>
        <span><small>{copy.travelFreedom}</small><strong>{country.freedomScore}%</strong></span>
      </div>
      <span className="hover-link">{copy.viewDetails} <ArrowRight size={13} /></span>
    </aside>
  );
}

function ComparisonDialog({ initialRight, locale, onClose }: { initialRight: CountryProfile; locale: SiteLocale; onClose: () => void }) {
  const [leftIso, setLeftIso] = useState(initialRight.iso3 === "CHN" ? "JPN" : "CHN");
  const [rightIso, setRightIso] = useState(initialRight.dataReady === false ? "JPN" : initialRight.iso3);
  const left = countries.find((country) => country.iso3 === leftIso) ?? countries[0];
  const right = countries.find((country) => country.iso3 === rightIso) ?? countries[1];
  const copy = getAtlasCopy(locale);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div><span className="section-kicker">{copy.compareKicker}</span><h2 id="compare-title">{copy.compareTitle}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={copy.close}><X size={20} /></button>
        </div>
        <div className="compare-selectors">
          <CountrySelect value={leftIso} locale={locale} onChange={setLeftIso} />
          <span className="versus">VS</span>
          <CountrySelect value={rightIso} locale={locale} onChange={setRightIso} />
        </div>
        <div className="compare-table" role="table" aria-label={copy.comparisonResults}>
          <CompareRow rankRow label={copy.ranking} left={`#${left.passportRank}`} right={`#${right.passportRank}`} />
          <CompareRow label={copy.visaFree} left={left.accessibleCountries} right={right.accessibleCountries} />
          <CompareRow label={copy.arrival} left={left.visaOnArrivalCountries} right={right.visaOnArrivalCountries} />
          <CompareRow label={copy.visaRequired} left={left.visaRequiredCountries} right={right.visaRequiredCountries} reverse />
        </div>
        <div className="freedom-comparison">
          <div className="freedom-label"><span>{left.flag} {getCountryName(left, locale)}</span><strong>{left.freedomScore}%</strong></div>
          <div className="progress-track"><span style={{ width: `${left.freedomScore}%`, background: left.passportColor }} /></div>
          <div className="freedom-label"><span>{right.flag} {getCountryName(right, locale)}</span><strong>{right.freedomScore}%</strong></div>
          <div className="progress-track"><span style={{ width: `${right.freedomScore}%`, background: right.passportColor }} /></div>
        </div>
      </section>
    </div>
  );
}

function CountrySelect({ value, locale, onChange }: { value: string; locale: SiteLocale; onChange: (value: string) => void }) {
  return (
    <label className="country-select">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {alphabeticalCountries.map((country) => <option key={country.iso3} value={country.iso3}>{country.flag} {getCountryName(country, locale)}</option>)}
      </select>
      <ChevronDown size={17} />
    </label>
  );
}

function CompareRow({ label, left, right, reverse = false, rankRow = false }: { label: string; left: string | number; right: string | number; reverse?: boolean; rankRow?: boolean }) {
  const leftNumber = typeof left === "number" ? left : Number(String(left).replace("#", ""));
  const rightNumber = typeof right === "number" ? right : Number(String(right).replace("#", ""));
  const leftWins = reverse ? leftNumber < rightNumber : rankRow ? leftNumber < rightNumber : leftNumber > rightNumber;
  const rightWins = reverse ? rightNumber < leftNumber : rankRow ? rightNumber < leftNumber : rightNumber > leftNumber;
  return (
    <div className="compare-row" role="row">
      <strong className={leftWins ? "winner" : ""}>{left}</strong>
      <span>{label}</span>
      <strong className={rightWins ? "winner" : ""}>{right}</strong>
    </div>
  );
}

const plannerRules: Record<string, { status: string; stay: string; tone: "green" | "amber" | "red" }> = {
  "CHN-FRA": { status: "需要申根签证", stay: "按签证批复期限停留", tone: "red" },
  "JPN-FRA": { status: "短期免签", stay: "180 天内最多 90 天", tone: "green" },
  "SGP-FRA": { status: "短期免签", stay: "180 天内最多 90 天", tone: "green" },
  "CHN-SGP": { status: "短期免签", stay: "通常不超过 30 天", tone: "green" },
  "CHN-JPN": { status: "需要签证", stay: "按签证类型确定", tone: "red" },
  "USA-JPN": { status: "短期免签", stay: "通常不超过 90 天", tone: "green" },
};

function PlannerDialog({ locale, onClose }: { locale: SiteLocale; onClose: () => void }) {
  const [origin, setOrigin] = useState("CHN");
  const [destination, setDestination] = useState("FRA");
  const originCountry = countries.find((country) => country.iso3 === origin) ?? countries[0];
  const destinationCountry = countries.find((country) => country.iso3 === destination) ?? countries[5];
  const copy = getAtlasCopy(locale);
  const rule = plannerRules[`${origin}-${destination}`] ?? {
    status: "需要核验最新政策",
    stay: "请以目的地官方信息为准",
    tone: "amber" as const,
  };
  const displayedRule = locale !== "zh" ? {
    ...rule,
    status: rule.tone === "green" ? copy.shortStayVisaFree : rule.tone === "red" ? copy.visaRequired : copy.verifyPolicy,
    stay: copy.officialSource,
  } : rule;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="planner-dialog" role="dialog" aria-modal="true" aria-labelledby="planner-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div><span className="section-kicker">{copy.tripCheck}</span><h2 id="planner-title">{copy.plannerTitle}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={copy.close}><X size={20} /></button>
        </div>
        <div className="planner-fields">
          <div><span>{copy.myPassport}</span><CountrySelect value={origin} locale={locale} onChange={setOrigin} /></div>
          <ArrowRight size={18} />
          <div><span>{copy.destination}</span><CountrySelect value={destination} locale={locale} onChange={setDestination} /></div>
        </div>
        <div className={`planner-result ${displayedRule.tone}`}>
          <span>{originCountry.flag} {getCountryName(originCountry, locale)}</span>
          <ArrowRight size={18} />
          <span>{destinationCountry.flag} {getCountryName(destinationCountry, locale)}</span>
          <strong>{displayedRule.status}</strong>
          <small>{displayedRule.stay}</small>
        </div>
        <p className="legal-note">{locale === "zh" ? "示例结果仅用于产品演示。出行前请向目的地使领馆或官方移民部门核验。" : copy.demoNotice}</p>
      </section>
    </div>
  );
}

function AuthDialog({ locale, onClose }: { locale: SiteLocale; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const copy = getAtlasCopy(locale);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div><span className="section-kicker">{copy.signIn}</span><h2 id="auth-title">{copy.signIn}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={copy.close}><X size={20} /></button>
        </div>
        {submitted ? (
          <div className="auth-success"><ShieldCheck size={22} /><strong>{copy.accountReady}</strong><span>{copy.accountDescription}</span></div>
        ) : (
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setSubmitted(true); }}>
            <label htmlFor="account-email">{copy.email}</label>
            <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
            <button type="submit">{copy.continue} <ArrowRight size={17} /></button>
          </form>
        )}
      </section>
    </div>
  );
}
