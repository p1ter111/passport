"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Globe2, Minus, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile, Region } from "@/types/passport";
import type { GroupPreferences, VisaTolerance } from "@/types/group-trip";
import { getCountryName } from "@/lib/i18n";
import { createTravelGroup } from "@/lib/group-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

const countries = [...countriesData as CountryProfile[]].sort((left, right) => left.name.localeCompare(right.name, "en"));
const regions = Array.from(new Set(countries.map((country) => country.region)));
type DraftMember = { id: string; displayName: string; passportIso3: string };

export function GroupCreate() {
  const locale = useSiteLanguage();
  const router = useRouter();
  const { configured, loading, user } = useAuth();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<DraftMember[]>([
    { id: crypto.randomUUID(), displayName: "", passportIso3: "CHN" },
    { id: crypto.randomUUID(), displayName: "", passportIso3: "JPN" },
  ]);
  const [travelMonth, setTravelMonth] = useState("");
  const [tripDays, setTripDays] = useState(7);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [visaTolerance, setVisaTolerance] = useState<VisaTolerance>("evisa");
  const [includeVisaRequired, setIncludeVisaRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!configured || !user)) router.replace("/account?mode=signin&next=/groups/new");
    if (user && !members[0].displayName) setMembers((current) => current.map((member, index) => index === 0 ? { ...member, displayName: user.user_metadata.display_name || user.email?.split("@")[0] || "Traveler 1" } : member));
  }, [configured, loading, members, router, user]);

  const preferences = useMemo<GroupPreferences>(() => ({
    travelMonth,
    tripDays,
    regions: selectedRegions,
    visaTolerance,
    includeVisaRequired,
  }), [includeVisaRequired, selectedRegions, travelMonth, tripDays, visaTolerance]);

  const updateMember = (id: string, changes: Partial<DraftMember>) => setMembers((current) => current.map((member) => member.id === id ? { ...member, ...changes } : member));
  const toggleRegion = (region: Region) => setSelectedRegions((current) => current.includes(region) ? current.filter((item) => item !== region) : [...current, region]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !user) return;
    if (members.some((member) => !member.displayName.trim())) {
      setError(groupText(locale, "请填写每位成员的名字。", "Add a name for every traveler."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const group = await createTravelGroup(client, user.id, { name, preferences, members });
      router.push(`/groups/${group.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create group.");
      setBusy(false);
    }
  };

  if (loading || !user) return <GroupShell backHref="/groups"><div className="group-results-state"><Globe2 size={22} />Passport Atlas</div></GroupShell>;

  return (
    <GroupShell backHref="/groups" backLabel={groupText(locale, "返回旅行小组", "Back to groups")}>
      <form className="group-create-form" onSubmit={submit}>
        <header><span className="group-kicker"><UsersRound size={15} />NEW GROUP</span><h1>{groupText(locale, "建立共同旅行地图", "Build your shared travel map")}</h1><p>{groupText(locale, "先加入所有旅行者，再设定本次旅程能接受的签证准备程度。", "Add every traveler, then decide how much visa preparation the group accepts.")}</p></header>
        <section className="group-create-section"><div className="group-create-section-heading"><span>01</span><div><h2>{groupText(locale, "小组与成员", "Group and travelers")}</h2><p>{groupText(locale, "第一位成员是小组创建者。相同护照也可以重复添加。", "The first traveler is the group owner. Duplicate passports are allowed.")}</p></div></div><label className="group-field"><span>{groupText(locale, "小组名称", "Group name")}</span><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder={groupText(locale, "例如：十月东京计划", "e.g. October escape")} /></label><div className="group-member-editor">{members.map((member, index) => <div key={member.id}><span className="group-member-number">{String(index + 1).padStart(2, "0")}</span><label><span>{groupText(locale, "名字", "Name")}</span><input value={member.displayName} onChange={(event) => updateMember(member.id, { displayName: event.target.value })} required maxLength={60} /></label><label><span>{groupText(locale, "护照", "Passport")}</span><select value={member.passportIso3} onChange={(event) => updateMember(member.id, { passportIso3: event.target.value })}>{countries.map((country) => <option value={country.iso3} key={country.iso3}>{country.flag} {getCountryName(country, locale)}</option>)}</select></label>{index > 1 && <button type="button" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))} aria-label={groupText(locale, "移除成员", "Remove traveler")}><Minus size={16} /></button>}</div>)}</div>{members.length < 10 && <button className="group-add-member" type="button" onClick={() => setMembers((current) => [...current, { id: crypto.randomUUID(), displayName: "", passportIso3: "SGP" }])}><Plus size={16} />{groupText(locale, "添加旅行者", "Add traveler")}</button>}</section>
        <section className="group-create-section"><div className="group-create-section-heading"><span>02</span><div><h2>{groupText(locale, "共同偏好", "Shared preferences")}</h2><p>{groupText(locale, "月份用于协调和展示，不参与天气评分。", "The month is for coordination and display; no weather score is invented.")}</p></div></div><div className="group-preferences-grid"><label className="group-field"><span><CalendarDays size={14} />{groupText(locale, "旅行月份", "Travel month")}</span><input type="month" value={travelMonth} onChange={(event) => setTravelMonth(event.target.value)} /></label><label className="group-field"><span>{groupText(locale, "预计天数", "Trip length")}</span><input type="number" min={1} max={365} value={tripDays} onChange={(event) => setTripDays(Math.min(365, Math.max(1, Number(event.target.value))))} required /></label></div><div className="group-region-picker"><span>{groupText(locale, "偏好地区（不选表示全球）", "Preferred regions (empty means worldwide)")}</span><div>{regions.map((region) => <button type="button" key={region} className={selectedRegions.includes(region) ? "active" : ""} onClick={() => toggleRegion(region)}>{selectedRegions.includes(region) && <Check size={13} />}{region}</button>)}</div></div><div className="group-tolerance"><span>{groupText(locale, "最高签证准备难度", "Maximum visa effort")}</span><div>{(["visa-free", "arrival", "evisa"] as VisaTolerance[]).map((value) => <button type="button" key={value} className={visaTolerance === value ? "active" : ""} onClick={() => setVisaTolerance(value)}><ShieldCheck size={15} /><strong>{value === "visa-free" ? groupText(locale, "仅免签", "Visa free only") : value === "arrival" ? groupText(locale, "接受 ETA / 落地签", "ETA / arrival accepted") : groupText(locale, "接受电子签", "E-visa accepted")}</strong></button>)}</div></div><label className="group-create-switch"><input type="checkbox" checked={includeVisaRequired} onChange={(event) => setIncludeVisaRequired(event.target.checked)} /><span /><div><strong>{groupText(locale, "包含需要传统签证的目的地", "Include traditional visa destinations")}</strong><small>{groupText(locale, "默认关闭；开启后这些国家会降分显示。", "Off by default; these destinations appear with a lower score.")}</small></div></label></section>
        {error && <div className="group-create-error" role="alert">{error}</div>}
        <button className="group-create-submit" type="submit" disabled={busy}>{busy ? groupText(locale, "正在创建…", "Creating...") : groupText(locale, "创建并计算共同目的地", "Create and calculate matches")}<ArrowRight size={18} /></button>
      </form>
    </GroupShell>
  );
}
