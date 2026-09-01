"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Globe2,
  Heart,
  ImageIcon,
  MapPinned,
  Plane,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import type { VisaRules, VisaStatus } from "@/types/visa";
import { PassportCover } from "./passport-cover";
import { PassportHistory } from "./passport-history";
import { useSiteLanguage } from "./site-language";
import { formatCopy, getAppCopy, getCountryName, getRegionName } from "@/lib/i18n";
import { usePassportLibrary } from "./use-passport-library";
import {
  getRuleForCountry,
  VisaWorldMap,
  visaStatusColors,
  visaStatusLabels,
} from "./visa-world-map";

type PassportDetailProps = {
  country: CountryProfile;
  visaRules: VisaRules;
};

type FilterStatus = "all" | Exclude<VisaStatus, "-1" | "unknown">;

const countries = countriesData as CountryProfile[];

const filters: Array<{ status: FilterStatus; countKey?: keyof CountryProfile }> = [
  { status: "all" },
  { status: "visa free", countKey: "visaFreeCountries" },
  { status: "visa on arrival", countKey: "visaOnArrivalCountries" },
  { status: "eta", countKey: "etaCountries" },
  { status: "e-visa", countKey: "eVisaCountries" },
  { status: "visa required", countKey: "visaRequiredCountries" },
  { status: "no admission", countKey: "noAdmissionCountries" },
];

const visaLabelsEn: Record<VisaStatus | "origin" | "all", string> = {
  all: "All destinations", origin: "Passport country", "visa free": "Visa free", "visa on arrival": "Visa on arrival",
  eta: "ETA", "e-visa": "E-visa", "visa required": "Visa required", "no admission": "No admission", "-1": "Passport country", unknown: "No data",
};

function labelForStatus(status: VisaStatus | "origin" | "all", locale: string) {
  const copy = getAppCopy(locale);
  if (status === "all") return copy.allDestinations;
  if (status === "origin" || status === "-1") return copy.passportCountry;
  if (status === "visa free") return copy.visaFree;
  if (status === "visa on arrival") return copy.visaOnArrival;
  if (status === "eta") return copy.eta;
  if (status === "e-visa") return copy.eVisa;
  if (status === "visa required") return copy.visaRequired;
  if (status === "no admission") return copy.noAdmission;
  return copy.noData;
}

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

function getStatusDescription(status: VisaStatus, days: number | string | null | undefined, locale: string) {
  const copy = getAppCopy(locale);
  if (status === "-1") return copy.originDescription;
  if (status === "visa free") return days ? formatCopy(copy.visaFreeDays, { days }) : copy.visaFreeDescription;
  if (status === "visa on arrival") return days ? formatCopy(copy.arrivalDays, { days }) : copy.arrivalDescription;
  if (status === "eta") return copy.etaDescription;
  if (status === "e-visa") return copy.eVisaDescription;
  if (status === "visa required") return copy.visaRequiredDescription;
  if (status === "no admission") return copy.noAdmissionDescription;
  return copy.unknownDescription;
}

export function PassportDetail({ country, visaRules }: PassportDetailProps) {
  const router = useRouter();
  const locale = useSiteLanguage();
  const copy = getAppCopy(locale);
  const { favorites, toggleFavorite, addRecentPassport } = usePassportLibrary();
  const [selectedDestination, setSelectedDestination] = useState(country);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [passportQuery, setPassportQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const selectedRule = getRuleForCountry(country, selectedDestination, visaRules);
  const selectedIsOrigin = selectedDestination.iso2 === country.iso2;
  const isFavorite = favorites.includes(country.iso3);
  const officialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${selectedDestination.name} official immigration visa entry requirements`)}`;

  useEffect(() => {
    addRecentPassport(country.iso3);
  }, [addRecentPassport, country.iso3]);

  const passportSuggestions = useMemo(() => {
    const query = normalizeSearch(passportQuery);
    if (!query) return [];
    return countries
      .filter((item) => item.aliases.join(" ").toLocaleLowerCase().includes(query))
      .sort((left, right) => searchPriority(left, query) - searchPriority(right, query) || left.passportRank - right.passportRank)
      .slice(0, 6);
  }, [passportQuery]);

  const destinations = useMemo(() => {
    const query = normalizeSearch(destinationQuery);
    return countries
      .filter((destination) => {
        const rule = getRuleForCountry(country, destination, visaRules);
        const matchesFilter = activeFilter === "all" || rule.status === activeFilter;
        const matchesSearch = !query || [destination.name, destination.nameZh, destination.iso2, destination.iso3, ...destination.aliases]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query);
        return matchesFilter && matchesSearch;
      })
      .sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
  }, [activeFilter, country, destinationQuery, visaRules]);

  const matrixAccessible = country.matrixAccessibleCountries ?? country.visaFreeCountries + country.visaOnArrivalCountries + country.etaCountries;

  return (
    <main className="passport-detail-shell">
      <header className="detail-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><Globe2 size={22} strokeWidth={1.8} /></span>
          <span>Passport <strong>Atlas</strong></span>
        </Link>
        <nav aria-label={copy.mainNavigation}>
          <Link href="/">{copy.explore}</Link>
          <Link href="/#ranking">{copy.rankings}</Link>
          <Link href="/">{copy.compareTool}</Link>
        </nav>
        <div className="detail-header-actions">
          <Link href="/saved"><Bookmark size={16} />{copy.myList}</Link>
          <button type="button" className={isFavorite ? "active" : ""} onClick={() => toggleFavorite(country.iso3)} aria-pressed={isFavorite}>
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? copy.removeFavorite : copy.addFavorite}
          </button>
        </div>
      </header>

      <section className="passport-profile-band" aria-labelledby="passport-title">
        <div className="passport-profile-inner">
          <PassportCover color={country.passportColor} name={getCountryName(country, locale)} flag={country.flag} cover={country.passportCover} />
          <div className="passport-profile-copy">
            <div className="detail-eyebrow"><span>{country.flag}</span>{getRegionName(country.region, locale)} · {country.iso3}</div>
            <h1 id="passport-title">{formatCopy(copy.passportTitle, { country: getCountryName(country, locale) })}</h1>
            <p>{locale === "zh" ? country.intro : formatCopy(copy.passportIntro, { country: getCountryName(country, locale) })}</p>
            {country.passportCoverSource && (
              <a
                className="cover-reference"
                href={country.passportCoverSource}
                target="_blank"
                rel="noreferrer"
                title={country.passportCoverNote}
              >
                <ImageIcon size={14} /> {copy.coverReference}
                <span>{locale === "en" ? country.passportCoverLicense : copy.coverReference} · {copy.editionsVary}</span>
              </a>
            )}
            <div className="data-stamp"><ShieldCheck size={15} />{copy.henleyStamp}</div>
            <div className="data-stamp"><ShieldCheck size={15} />{copy.matrixStamp}</div>
          </div>
          <div className="passport-rank-block">
            <span>{copy.globalPassportRank}</span>
            <strong>#{country.passportRank}</strong>
            <small>{country.freedomScore}% {copy.travelFreedom}</small>
          </div>
        </div>

        <div className="passport-stat-strip" aria-label={`${getCountryName(country, locale)} ${copy.passport}`}>
            <div><span>{copy.accessible}</span><strong>{country.accessibleCountries}</strong></div>
          <div><span>{copy.onArrival}</span><strong>{country.visaOnArrivalCountries}</strong></div>
          <div><span>{copy.eta}</span><strong>{country.etaCountries}</strong></div>
          <div><span>{copy.eVisa}</span><strong>{country.eVisaCountries}</strong></div>
          <div><span>{copy.visaRequired}</span><strong>{country.visaRequiredCountries}</strong></div>
          <div><span>{copy.matrixAccess}</span><strong>{matrixAccessible}</strong></div>
        </div>
      </section>

      <PassportHistory country={country} locale={locale} />

      <section className="visa-map-section" aria-labelledby="visa-map-title">
        <div className="visa-map-heading">
          <div>
            <span className="section-kicker">{copy.globalAccess}</span>
            <h2 id="visa-map-title">{formatCopy(copy.passportAccessMap, { country: getCountryName(country, locale) })}</h2>
            <p>{copy.mapIntro}</p>
          </div>
          <div className="passport-switcher">
            <Search size={17} />
            <input
              value={passportQuery}
              onChange={(event) => setPassportQuery(event.target.value)}
              placeholder={copy.switchPassport}
              aria-label={copy.switchPassport}
            />
            {passportSuggestions.length > 0 && (
              <div className="passport-switcher-results">
                {passportSuggestions.map((item) => (
                  <button
                    key={item.iso2}
                    type="button"
                    onClick={() => router.push(`/passport/${item.iso3.toLowerCase()}`)}
                  >
                    <span>{item.flag}</span>
                    <span><strong>{getCountryName(item, locale)}</strong><small>{item.iso3}</small></span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="visa-map-workspace">
          <div className="visa-map-canvas">
            <VisaWorldMap
              origin={country}
              visaRules={visaRules}
              selectedDestination={selectedDestination}
              onDestinationSelect={setSelectedDestination}
              locale={locale}
            />
            <div className="visa-map-legend" aria-label={copy.visaLegend}>
              {(["origin", "visa free", "visa on arrival", "eta", "e-visa", "visa required", "no admission"] as const).map((status) => (
                <span key={status}><i style={{ background: visaStatusColors[status] }} />{labelForStatus(status, locale)}</span>
              ))}
            </div>
          </div>

          <aside className="destination-panel" aria-live="polite">
            <div className="destination-country">
              <span>{selectedDestination.flag}</span>
              <div><strong>{getCountryName(selectedDestination, locale)}</strong><small>{selectedDestination.iso3}</small></div>
            </div>
            <div
              className="visa-status-badge"
              style={{
                color: selectedIsOrigin ? visaStatusColors.origin : visaStatusColors[selectedRule.status],
                borderColor: selectedIsOrigin ? visaStatusColors.origin : visaStatusColors[selectedRule.status],
              }}
            >
              <i style={{ background: selectedIsOrigin ? visaStatusColors.origin : visaStatusColors[selectedRule.status] }} />
              {selectedIsOrigin ? labelForStatus("origin", locale) : labelForStatus(selectedRule.status, locale)}
            </div>
            <h3>{selectedIsOrigin ? formatCopy(copy.passportCountryTitle, { country: getCountryName(country, locale) }) : `${getCountryName(country, locale)} → ${getCountryName(selectedDestination, locale)}`}</h3>
            <p>{getStatusDescription(selectedRule.status, selectedRule.days, locale)}</p>
            <div className="destination-meta">
              <span><Globe2 size={15} />{getRegionName(selectedDestination.region, locale)}</span>
              <span><MapPinned size={15} />{selectedDestination.iso3}</span>
              {selectedRule.days && <span><CalendarDays size={15} />{selectedRule.days} {copy.days}</span>}
            </div>
            <div className="destination-evidence">
              <div><ShieldCheck size={15} /><span><small>{copy.evidenceLevel}</small><strong>{copy.evidenceReference}</strong></span></div>
              <small>{copy.dataUpdated}</small>
              <nav>
                <a href="https://www.iatatravelcentre.com/" target="_blank" rel="noreferrer">{copy.openIata}<ExternalLink size={13} /></a>
                <a href={officialSearchUrl} target="_blank" rel="noreferrer">{copy.findOfficial}<ExternalLink size={13} /></a>
              </nav>
            </div>
            <div className="policy-notice">{copy.policyNotice}</div>
          </aside>
        </div>
      </section>

      <section className="destination-section" aria-labelledby="destination-title">
        <div className="destination-heading">
          <div>
            <span className="section-kicker">{copy.destinationKicker}</span>
            <h2 id="destination-title">{copy.destinationVisaList}</h2>
          </div>
          <label className="destination-search">
            <Search size={17} />
            <input value={destinationQuery} onChange={(event) => setDestinationQuery(event.target.value)} placeholder={copy.searchDestinations} aria-label={copy.searchDestinations} />
          </label>
        </div>

        <div className="visa-filter-tabs" role="group" aria-label={copy.filterVisaStatus}>
          {filters.map((filter) => {
            const count = filter.status === "all" ? countries.length : Number(country[filter.countKey!] ?? 0);
            return (
              <button
                key={filter.status}
                className={activeFilter === filter.status ? "active" : ""}
                type="button"
                onClick={() => setActiveFilter(filter.status)}
              >
                {labelForStatus(filter.status, locale)} <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="destination-list" aria-label={copy.destinationVisaInfo}>
          {destinations.map((destination) => {
            const rule = getRuleForCountry(country, destination, visaRules);
            const isOrigin = destination.iso2 === country.iso2;
            return (
              <button
                key={destination.iso2}
                type="button"
                onClick={() => {
                  setSelectedDestination(destination);
                  document.querySelector("#visa-map-title")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="destination-flag">{destination.flag}</span>
                <span className="destination-name"><strong>{getCountryName(destination, locale)}</strong><small>{destination.iso3}</small></span>
                <span className="destination-status" style={{ color: isOrigin ? visaStatusColors.origin : visaStatusColors[rule.status] }}>
                  <i style={{ background: isOrigin ? visaStatusColors.origin : visaStatusColors[rule.status] }} />
                  {isOrigin ? labelForStatus("origin", locale) : labelForStatus(rule.status, locale)}
                </span>
                <ArrowRight size={15} />
              </button>
            );
          })}
        </div>

        {destinations.length === 0 && <div className="empty-destinations"><Plane size={20} />{copy.emptyDestinations}</div>}
      </section>

      <footer className="detail-footer">
        <span><Globe2 size={17} />Passport Atlas</span>
        <p>{copy.sourceNote}</p>
        <Link href="/"><ArrowLeft size={14} />{copy.backHome}</Link>
      </footer>
    </main>
  );
}
