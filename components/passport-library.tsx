"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Bookmark, Clock3, Globe2, Heart, MapPinned, Trash2 } from "lucide-react";
import countriesData from "@/data/countries.json";
import { getAppCopy, getCountryName, toTraditional } from "@/lib/i18n";
import type { CountryProfile } from "@/types/passport";
import { usePassportLibrary } from "./use-passport-library";
import { useSiteLanguage } from "./site-language";

const countries = countriesData as CountryProfile[];

function findCountry(iso3: string) {
  return countries.find((country) => country.iso3 === iso3);
}

export function PassportLibrary() {
  const locale = useSiteLanguage();
  const copy = getAppCopy(locale);
  const { loaded, favorites, recentPassports, savedRoutes, toggleFavorite, removeRoute } = usePassportLibrary();
  const label = (simplified: string, english: string) => locale === "zh-TW" ? toTraditional(simplified) : locale === "zh" ? simplified : english;
  const favoriteCountries = favorites.map(findCountry).filter(Boolean) as CountryProfile[];
  const recentCountries = recentPassports.map(findCountry).filter(Boolean) as CountryProfile[];

  return (
    <main className="library-page">
      <header className="library-header">
        <Link className="brand" href="/"><span className="brand-mark"><Globe2 size={21} /></span><span>Passport <strong>Atlas</strong></span></Link>
        <Link className="back-home" href="/"><ArrowLeft size={16} />{copy.backHome}</Link>
      </header>

      <section className="library-intro">
        <span>{label("个人旅行空间", "PERSONAL TRAVEL SPACE")}</span>
        <h1>{label("我的护照与旅程", "My passports and journeys")}</h1>
        <p>{label("收藏、最近查看和保存的路线都只保存在当前浏览器。", "Favorites, recent views, and saved routes stay in this browser.")}</p>
      </section>

      <section className="library-section">
        <header><span><Heart size={18} /></span><div><h2>{label("收藏的护照", "Favorite passports")}</h2><p>{favorites.length} {label("本", "saved")}</p></div></header>
        {!loaded ? <div className="library-empty">{copy.pending}</div> : favoriteCountries.length ? (
          <div className="library-country-list">
            {favoriteCountries.map((country) => (
              <div className="library-country-row" key={country.iso3}>
                <span>{country.flag}</span>
                <div><strong>{getCountryName(country, locale)}</strong><small>#{country.passportRank} · {country.accessibleCountries} {copy.destinations}</small></div>
                <Link href={`/passport/${country.iso3.toLowerCase()}`}>{copy.view}<ArrowRight size={15} /></Link>
                <button type="button" onClick={() => toggleFavorite(country.iso3)} aria-label={label(`移除${country.nameZh}`, `Remove ${country.name}`)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        ) : <div className="library-empty"><Heart size={20} /><span>{label("还没有收藏护照", "No favorite passports yet")}</span><Link href="/explore">{label("探索护照", "Explore passports")}</Link></div>}
      </section>

      <section className="library-section">
        <header><span><Bookmark size={18} /></span><div><h2>{label("保存的路线", "Saved routes")}</h2><p>{savedRoutes.length} {label("条", "saved")}</p></div></header>
        {!loaded ? <div className="library-empty">{copy.pending}</div> : savedRoutes.length ? (
          <div className="library-route-list">
            {savedRoutes.map((route) => {
              const origin = findCountry(route.originIso3);
              const destination = findCountry(route.destinationIso3);
              const transit = route.transitIso3 ? findCountry(route.transitIso3) : undefined;
              if (!origin || !destination) return null;
              return (
                <div className="library-route-row" key={route.id}>
                  <div className="library-route-path"><span>{origin.flag}</span><i /><MapPinned size={15} /><i /><span>{destination.flag}</span></div>
                  <div><strong>{getCountryName(origin, locale)} → {getCountryName(destination, locale)}</strong><small>{route.tripDays} {copy.days} · {route.departureDate || label("日期待定", "Date not set")}{transit ? ` · ${label("经", "via")} ${getCountryName(transit, locale)}` : ""}</small></div>
                  <Link href={`/plan?from=${route.originIso3}&to=${route.destinationIso3}&days=${route.tripDays}&date=${encodeURIComponent(route.departureDate)}&purpose=${route.purpose}${route.transitIso3 ? `&transit=${route.transitIso3}` : ""}`}>{label("打开", "Open")}<ArrowRight size={15} /></Link>
                  <button type="button" onClick={() => removeRoute(route.id)} aria-label={label("移除路线", "Remove route")}><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
        ) : <div className="library-empty"><Bookmark size={20} /><span>{label("还没有保存路线", "No saved routes yet")}</span><Link href="/">{copy.travelPlanner}</Link></div>}
      </section>

      <section className="library-section library-recent">
        <header><span><Clock3 size={18} /></span><div><h2>{label("最近查看", "Recently viewed")}</h2><p>{recentCountries.length} {label("本", "passports")}</p></div></header>
        {recentCountries.length ? <div className="library-recent-strip">{recentCountries.map((country) => <Link href={`/passport/${country.iso3.toLowerCase()}`} key={country.iso3}><span>{country.flag}</span><strong>{getCountryName(country, locale)}</strong><small>#{country.passportRank}</small></Link>)}</div> : <div className="library-empty">{label("查看护照后会显示在这里", "Viewed passports will appear here")}</div>}
      </section>
    </main>
  );
}
