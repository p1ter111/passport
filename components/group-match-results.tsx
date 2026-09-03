"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { CalendarDays, Check, Download, ExternalLink, Globe2, Heart, Info, MapPin, ThumbsDown, ThumbsUp, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import type { DestinationVote, GroupDestinationMatch, GroupMatchResponse, GroupMember, GroupPreferences } from "@/types/group-trip";
import type { VisaStatus } from "@/types/visa";
import { getCountryName } from "@/lib/i18n";
import { useSiteLanguage } from "./site-language";
import { groupText } from "./group-shell";

const WorldMap = dynamic(() => import("./world-map").then((module) => module.WorldMap), {
  ssr: false,
  loading: () => <div className="group-map-loading">Passport Atlas</div>,
});

const countries = countriesData as CountryProfile[];
const countryByIso3 = new Map(countries.map((country) => [country.iso3, country]));
const countryByNumericId = new Map(countries.map((country) => [country.numericId, country]));

const statusColors: Record<VisaStatus, string> = {
  "-1": "#333633",
  "visa free": "#75b890",
  eta: "#82a9cf",
  "visa on arrival": "#d8bd67",
  "e-visa": "#d89d70",
  "visa required": "#cc7d78",
  unknown: "#d9d9d4",
  "no admission": "#676b68",
};

function matchColor(match?: GroupDestinationMatch) {
  if (!match) return "#e8e8e4";
  if (match.groupScore >= 94) return "#9ac8aa";
  if (match.groupScore >= 82) return "#cad3a1";
  if (match.groupScore >= 65) return "#dec796";
  return "#d7a09b";
}

function statusLabel(status: VisaStatus, locale: string) {
  const labels: Record<VisaStatus, [string, string]> = {
    "-1": ["境内", "Domestic"],
    "visa free": ["免签", "Visa free"],
    eta: ["电子许可", "ETA"],
    "visa on arrival": ["落地签", "Visa on arrival"],
    "e-visa": ["电子签", "E-visa"],
    "visa required": ["需要签证", "Visa required"],
    unknown: ["待核验", "Needs verification"],
    "no admission": ["暂不准入", "No admission"],
  };
  return groupText(locale, labels[status][0], labels[status][1]);
}

type GroupMatchResultsProps = {
  groupName: string;
  members: GroupMember[];
  preferences: GroupPreferences;
  votes?: DestinationVote[];
  currentUserId?: string;
  /** The stable, read-only result URL used for poster QR codes. */
  shareUrl?: string;
  readOnly?: boolean;
  onVote?: (destinationIso3: string, value: -1 | 1) => Promise<void> | void;
};

export function GroupMatchResults({
  groupName,
  members,
  preferences,
  votes = [],
  currentUserId,
  shareUrl,
  readOnly = false,
  onVote,
}: GroupMatchResultsProps) {
  const locale = useSiteLanguage();
  const [response, setResponse] = useState<GroupMatchResponse | null>(null);
  const [error, setError] = useState("");
  const [selectedIso3, setSelectedIso3] = useState("");
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/api/group-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: members.map((member) => ({ id: member.id, name: member.displayName, passportIso3: member.passportIso3 })),
        preferences,
      }),
      signal: controller.signal,
    })
      .then(async (result) => {
        const body = await result.json();
        if (!result.ok) throw new Error(body.error || "Unable to calculate matches.");
        return body as GroupMatchResponse;
      })
      .then((body) => {
        setResponse(body);
        setSelectedIso3((current) => body.matches.some((match) => match.destinationIso3 === current) ? current : body.matches[0]?.destinationIso3 ?? "");
      })
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      });
    return () => controller.abort();
  }, [members, preferences]);

  useEffect(() => {
    // Always encode the stable read-only URL. Invite tokens are single-use and
    // must never leak into a downloadable or publicly shared poster.
    if (!shareUrl) {
      setQrCode("");
      return;
    }
    QRCode.toDataURL(shareUrl, { width: 260, margin: 1, color: { dark: "#252724", light: "#ffffff" } }).then(setQrCode);
  }, [shareUrl]);

  const voteStats = useMemo(() => {
    const result = new Map<string, { up: number; down: number; mine: -1 | 0 | 1 }>();
    for (const vote of votes) {
      const current = result.get(vote.destinationIso3) ?? { up: 0, down: 0, mine: 0 as const };
      if (vote.value === 1) current.up += 1;
      else current.down += 1;
      if (vote.userId === currentUserId) current.mine = vote.value;
      result.set(vote.destinationIso3, current);
    }
    return result;
  }, [currentUserId, votes]);

  const matches = response?.matches ?? [];
  const dataIsStale = response ? Date.now() - new Date(`${response.dataSnapshot}T00:00:00Z`).getTime() > response.staleAfterDays * 24 * 60 * 60 * 1000 : false;
  const resultByIso3 = useMemo(() => new Map(matches.map((match) => [match.destinationIso3, match])), [matches]);
  const selected = resultByIso3.get(selectedIso3) ?? matches[0];
  const rankedMatches = shortlistOnly
    ? matches.filter((match) => {
      const stats = voteStats.get(match.destinationIso3);
      return stats && stats.up > stats.down;
    })
    : matches;

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setPosterBusy(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#f5f5f2" });
      const link = document.createElement("a");
      link.download = `${groupName.replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-") || "passport-atlas"}-match.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setPosterBusy(false);
    }
  };

  if (error) return <div className="group-results-state error"><Info size={20} /><strong>{groupText(locale, "无法计算匹配结果", "Unable to calculate matches")}</strong><span>{error}</span></div>;
  if (!response) return <div className="group-results-state"><Globe2 size={23} /><strong>{groupText(locale, "正在计算共同目的地", "Calculating shared destinations")}</strong><span>{groupText(locale, "正在比较每位成员的 199 个入境规则…", "Comparing 199 entry rules for every traveler...")}</span></div>;

  return (
    <>
      <section className="group-results-overview">
        <div>
          <span className="group-kicker"><UsersRound size={15} />GROUP TRIP MATCH</span>
          <h1>{groupName}</h1>
          <p>{groupText(locale, `为 ${members.length} 位旅行者找到 ${matches.length} 个共同目的地。排序优先照顾最不方便入境的成员。`, `${matches.length} shared destinations for ${members.length} travelers, ranked around the member with the hardest entry path.`)}</p>
        </div>
        <div className="group-results-actions">
          <button type="button" onClick={() => setShortlistOnly((value) => !value)} aria-pressed={shortlistOnly}><Heart size={16} fill={shortlistOnly ? "currentColor" : "none"} />{groupText(locale, "共同候选", "Shortlist")}</button>
          <button type="button" onClick={downloadPoster} disabled={posterBusy}><Download size={16} />{posterBusy ? groupText(locale, "生成中…", "Rendering...") : groupText(locale, "下载结果海报", "Download poster")}</button>
        </div>
      </section>

      <section className="group-map-layout">
        <div className="group-map-stage">
          <div className="group-map-meta"><span>{groupText(locale, "共同通行地图", "Shared access map")}</span><small>{groupText(locale, "点击国家查看全员要求", "Select a country to inspect every traveler")}</small></div>
          <WorldMap
            selectedId={countryByIso3.get(selected?.destinationIso3 ?? "")?.numericId ?? ""}
            colorForCountry={(numericId) => matchColor(resultByIso3.get(countryByNumericId.get(numericId)?.iso3 ?? ""))}
            onCountrySelect={(_name, numericId) => {
              const country = countryByNumericId.get(numericId);
              if (country && resultByIso3.has(country.iso3)) setSelectedIso3(country.iso3);
            }}
            locale={locale}
          />
          <div className="group-map-legend"><span><i className="best" />90–100</span><span><i className="good" />80–89</span><span><i className="mixed" />65–79</span><span><i className="hard" />{groupText(locale, "需更多准备", "More preparation")}</span></div>
        </div>

        {selected && <DestinationMatrix match={selected} locale={locale} votes={voteStats.get(selected.destinationIso3)} readOnly={readOnly} onVote={onVote} />}
      </section>

      <section className="group-ranking-section">
        <header><div><span className="group-kicker">COMMON DESTINATIONS</span><h2>{shortlistOnly ? groupText(locale, "小组共同候选", "Group shortlist") : groupText(locale, "最适合全员的目的地", "Best destinations for everyone")}</h2></div><span>{rankedMatches.length} / {response.totalEvaluated}</span></header>
        <div className="group-ranking-head"><span>#</span><span>{groupText(locale, "目的地", "Destination")}</span><span>{groupText(locale, "全员最低要求", "Hardest entry")}</span><span>{groupText(locale, "共同停留", "Shared stay")}</span><span>{groupText(locale, "匹配度", "Match")}</span><span>{groupText(locale, "投票", "Votes")}</span></div>
        <div className="group-ranking-list">
          {rankedMatches.slice(0, shortlistOnly ? 30 : 24).map((match, index) => {
            const country = countryByIso3.get(match.destinationIso3)!;
            const stats = voteStats.get(match.destinationIso3) ?? { up: 0, down: 0, mine: 0 };
            return (
              <button type="button" key={match.destinationIso3} className={match.destinationIso3 === selected?.destinationIso3 ? "active" : ""} onClick={() => { setSelectedIso3(match.destinationIso3); document.querySelector(".group-map-layout")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span><b>{country.flag}</b><span><strong>{getCountryName(country, locale)}</strong><small>{country.iso3} · {country.region}</small></span></span>
                <span><i style={{ background: statusColors[match.worstStatus] }} />{statusLabel(match.worstStatus, locale)}</span>
                <span>{match.commonStayDays ? `${match.commonStayDays} ${groupText(locale, "天", "days")}` : groupText(locale, "需核验", "Verify")}</span>
                <span><strong>{match.groupScore}</strong>/100</span>
                <span><ThumbsUp size={13} />{stats.up}<ThumbsDown size={13} />{stats.down}</span>
              </button>
            );
          })}
          {rankedMatches.length === 0 && <div className="group-ranking-empty">{groupText(locale, "还没有共同候选，成员点赞后会显示在这里。", "No shared shortlist yet. Destinations appear here after members vote.")}</div>}
        </div>
      </section>

      <section className={`group-data-note${dataIsStale ? " is-stale" : ""}`}>
        <Info size={15} />
        <span>{groupText(locale, `签证矩阵快照：${response.dataSnapshot}，来源：${response.dataSourceName}。建议每 ${response.recommendedRefreshDays} 天更新，超过 ${response.staleAfterDays} 天请视为待核验；订票前请通过目的地官方机构再次核验。`, `Visa matrix snapshot: ${response.dataSnapshot}, sourced from ${response.dataSourceName}. Refresh every ${response.recommendedRefreshDays} days; after ${response.staleAfterDays} days treat it as due for verification. Check the destination authority before booking.`)}</span>
        <a href={response.dataSourceUrl} target="_blank" rel="noreferrer">{groupText(locale, "查看数据来源", "View data source")}<ExternalLink size={13} /></a>
        <Link href="/explore">{groupText(locale, "查看护照数据库", "Open passport database")}<ExternalLink size={13} /></Link>
      </section>

      <div className="group-poster-offscreen" aria-hidden="true">
        <div className="group-poster-canvas" ref={posterRef}>
          <div className="group-poster-brand"><Globe2 size={26} /><span>Passport <b>Atlas</b></span><small>GROUP TRIP MATCH</small></div>
          <div className="group-poster-title"><small>{preferences.travelMonth || "TRAVEL PLAN"} · {preferences.tripDays} DAYS</small><h2>{groupName}</h2><p>{members.length} passports, one shared world.</p></div>
          <div className="group-poster-members">{members.map((member) => { const country = countryByIso3.get(member.passportIso3); return <span key={member.id}><b>{country?.flag}</b><small>{member.displayName}</small><strong>{country?.iso3}</strong></span>; })}</div>
          <div className="group-poster-map">
            <div className="group-poster-map-heading"><small>SHARED ACCESS MAP</small><span>{matches.length} destinations</span></div>
            <WorldMap
              selectedId=""
              colorForCountry={(numericId) => matchColor(resultByIso3.get(countryByNumericId.get(numericId)?.iso3 ?? ""))}
              onCountrySelect={() => undefined}
              locale={locale}
            />
          </div>
          <div className="group-poster-top"><small>TOP SHARED DESTINATIONS</small>{matches.slice(0, 3).map((match, index) => { const country = countryByIso3.get(match.destinationIso3)!; return <div key={match.destinationIso3}><span>0{index + 1}</span><b>{country.flag}</b><strong>{country.name}</strong><em>{match.groupScore}/100</em></div>; })}</div>
          <div className="group-poster-footer"><span><Check size={15} />{matches.length} shared destinations</span>{qrCode ? <img src={qrCode} alt="" /> : <Globe2 size={54} />}<small>Visa data {response.dataSnapshot}<br />Verify official rules before travel</small></div>
        </div>
      </div>
    </>
  );
}

function DestinationMatrix({ match, locale, votes, readOnly, onVote }: { match: GroupDestinationMatch; locale: string; votes?: { up: number; down: number; mine: -1 | 0 | 1 }; readOnly: boolean; onVote?: (destinationIso3: string, value: -1 | 1) => Promise<void> | void }) {
  const country = countryByIso3.get(match.destinationIso3)!;
  return (
    <aside className="group-destination-panel">
      <div className="group-destination-heading"><span>{country.flag}</span><div><small>{country.iso3} · {country.region}</small><h2>{getCountryName(country, locale)}</h2></div><strong>{match.groupScore}<small>/100</small></strong></div>
      <div className="group-destination-summary"><span><MapPin size={15} />{statusLabel(match.worstStatus, locale)}</span><span><CalendarDays size={15} />{match.commonStayDays ? `${match.commonStayDays} ${groupText(locale, "天共同停留", "shared days")}` : groupText(locale, "停留时间需核验", "Verify stay length")}</span></div>
      <div className="group-member-matrix">
        {match.members.map((memberRule) => {
          const passport = countryByIso3.get(memberRule.passportIso3);
          return <div key={memberRule.memberId}><span>{passport?.flag}</span><span><strong>{memberRule.memberName}</strong><small>{passport?.iso3} {groupText(locale, "护照", "passport")}</small></span><span style={{ color: statusColors[memberRule.status] }}><i style={{ background: statusColors[memberRule.status] }} />{statusLabel(memberRule.status, locale)}{memberRule.days ? <small>{String(memberRule.days)} {groupText(locale, "天", "days")}</small> : null}</span></div>;
        })}
      </div>
      {!readOnly && onVote && <div className="group-vote-controls"><span>{groupText(locale, "你会选择这里吗？", "Would you choose this destination?")}</span><button className={votes?.mine === 1 ? "active" : ""} type="button" onClick={() => onVote(match.destinationIso3, 1)} aria-label={groupText(locale, "赞成", "Vote yes")}><ThumbsUp size={17} />{votes?.up ?? 0}</button><button className={votes?.mine === -1 ? "active negative" : ""} type="button" onClick={() => onVote(match.destinationIso3, -1)} aria-label={groupText(locale, "反对", "Vote no")}><ThumbsDown size={17} />{votes?.down ?? 0}</button></div>}
    </aside>
  );
}
