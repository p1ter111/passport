"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Globe2, Map as MapIcon, Menu, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import { useSiteLanguage } from "./site-language";
import { getAppCopy, getCountryName, getRegionName } from "@/lib/i18n";

const countries = countriesData as CountryProfile[];

type SortMode = "rank" | "visaFree" | "freedom";

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "rank", label: "Global Rank" },
  { value: "visaFree", label: "Visa Free" },
  { value: "freedom", label: "Freedom" },
];

export function PassportRankings() {
  const router = useRouter();
  const locale = useSiteLanguage();
  const localized = getAppCopy(locale);
  const copy = {
    explore: localized.explore, rankings: localized.rankings, insights: localized.insights, search: localized.search,
    map: localized.flat, hero: localized.rankingHero, intro: localized.rankingIntro, countries: localized.countries,
    leading: localized.leadingRank, average: localized.averageFreedom, searchPlaceholder: localized.searchPlaceholder,
    region: localized.region, allRegions: localized.allRegions, results: localized.results, updated: localized.updated,
    rank: localized.rank, passport: localized.passport, visaFree: localized.visaFree, freedom: localized.freedom,
    destinations: localized.destinationCount, travelFreedom: localized.travelFreedom, empty: localized.empty,
    emptyHint: localized.emptyHint, back: localized.backToMap,
  };
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("rank");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const regions = useMemo(
    () => Array.from(new Set(countries.map((country) => country.region))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [],
  );

  const rankedCountries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = countries.filter((country) => {
      const matchesRegion = region === "all" || country.region === region;
      const searchable = [country.name, country.nameZh, country.iso2, country.iso3, ...country.aliases]
        .join(" ")
        .toLocaleLowerCase();
      return matchesRegion && (!normalized || searchable.includes(normalized));
    });

    return filtered.sort((left, right) => {
      if (sortMode === "visaFree") {
        return right.accessibleCountries - left.accessibleCountries || left.passportRank - right.passportRank;
      }
      if (sortMode === "freedom") {
        return right.freedomScore - left.freedomScore || left.passportRank - right.passportRank;
      }
      return left.passportRank - right.passportRank || right.freedomScore - left.freedomScore;
    });
  }, [query, region, sortMode]);

  const averageFreedom = Math.round(
    countries.reduce((total, country) => total + country.freedomScore, 0) / countries.length,
  );

  return (
    <main className="rankings-page">
      <header className="site-header rankings-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><Globe2 size={22} strokeWidth={1.8} /></span>
          <span>Passport <strong>Atlas</strong></span>
        </Link>

        <nav className="desktop-nav" aria-label={localized.mainNavigation}>
          <Link href="/">{copy.explore}</Link>
          <Link className="nav-active" href="/rankings">{copy.rankings}</Link>
          <Link href="/#insights">{copy.insights}</Link>
        </nav>

        <div className="header-actions">
          <button className="header-search" type="button" onClick={() => searchRef.current?.focus()}>
            <Search size={17} />
            <span>{copy.search}</span>
          </button>
          <Link className="icon-button header-library-link" href="/saved" aria-label={localized.myList} title={localized.myList}>
            <Bookmark size={17} />
          </Link>
          <Link className="login-button index-map-link" href="/">
            <MapIcon size={15} /> {copy.map}
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? localized.closeNavigation : localized.openNavigation}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label={localized.mobileNavigation}>
          <Link href="/">{copy.explore}</Link>
          <Link className="nav-active" href="/rankings">{copy.rankings}</Link>
          <button type="button" onClick={() => { searchRef.current?.focus(); setMobileMenuOpen(false); }}>{copy.search}</button>
          <Link href="/saved">{localized.myList}</Link>
          <Link href="/">{copy.back}</Link>
        </nav>
      )}

      <section className="index-hero" aria-labelledby="index-title">
        <div className="index-hero-copy">
          <span className="section-kicker">{localized.globalMobilityDatabase}</span>
          <h1 id="index-title">{copy.hero}</h1>
          <p>{copy.intro}</p>
        </div>
        <div className="index-summary" aria-label={localized.rankingOverview}>
          <div><strong>{countries.length}</strong><span>{copy.countries}</span></div>
          <div><strong>#{countries[0].passportRank}</strong><span>{copy.leading}</span></div>
          <div><strong>{averageFreedom}%</strong><span>{copy.average}</span></div>
        </div>
      </section>

      <section className="index-workspace" aria-label={localized.globalPassportRanking}>
        <div className="index-toolbar">
          <label className="index-search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={localized.clearSearch}><X size={16} /></button>}
          </label>

          <label className="index-region">
            <span>{copy.region}</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)} aria-label={copy.region}>
              <option value="all">{copy.allRegions}</option>
              {regions.map((item) => <option value={item} key={item}>{getRegionName(item, locale)}</option>)}
            </select>
          </label>

          <div className="index-sort" role="group" aria-label={localized.sortRanking}>
            {sortOptions.map((option) => (
              <button
                className={sortMode === option.value ? "active" : ""}
                type="button"
                key={option.value}
                onClick={() => setSortMode(option.value)}
              >
                {option.value === "rank" ? copy.rank : option.value === "visaFree" ? copy.visaFree : copy.freedom}
              </button>
            ))}
          </div>
        </div>

        <div className="index-result-meta">
          <span>{rankedCountries.length} {copy.results}</span>
          <span>{copy.updated}</span>
        </div>

        <div className="index-table">
          <div className="index-table-head" aria-hidden="true">
            <span>{copy.rank}</span><span>{copy.passport}</span><span>{copy.region}</span><span>{copy.visaFree}</span><span>{copy.freedom}</span><span />
          </div>
          {rankedCountries.length > 0 ? rankedCountries.map((country) => (
            <button
              className="index-row"
              type="button"
              key={country.iso3}
              onClick={() => router.push(`/passport/${country.iso3.toLowerCase()}`)}
              aria-label={`${localized.view} ${getCountryName(country, locale)} ${localized.passport}`}
            >
              <span className="index-rank">{String(country.passportRank).padStart(2, "0")}</span>
              <span className="index-country">
                <span className="index-flag">{country.flag}</span>
                <span><strong>{getCountryName(country, locale)}</strong><small>{country.iso2} · {country.iso3}</small></span>
              </span>
              <span className="index-region-cell">{getRegionName(country.region, locale)}</span>
              <span className="index-stat"><strong>{country.accessibleCountries}</strong><small>{copy.destinations}</small></span>
              <span className="index-stat index-freedom"><strong>{country.freedomScore}%</strong><small>{copy.travelFreedom}</small></span>
              <ArrowRight className="index-arrow" size={18} />
            </button>
          )) : (
            <div className="index-empty">
              <strong>{copy.empty}</strong>
              <span>{copy.emptyHint}</span>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer index-footer">
        <span><Globe2 size={18} /> Passport Atlas</span>
        <p>{localized.disclaimer}</p>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
