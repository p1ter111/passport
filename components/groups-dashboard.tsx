"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Globe2, LockKeyhole, Plus, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { TravelGroup } from "@/types/group-trip";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapGroup } from "@/lib/group-service";
import { useAuth } from "./auth-provider";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

type DashboardGroup = TravelGroup & { memberCount: number };

export function GroupsDashboard() {
  const locale = useSiteLanguage();
  const { configured, loading: authLoading, user } = useAuth();
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    client.from("travel_groups").select("*").order("updated_at", { ascending: false }).then(async ({ data, error: groupError }) => {
      if (groupError) {
        setError(groupError.message);
        setLoading(false);
        return;
      }
      const mapped = (data ?? []).map((row) => mapGroup(row as Parameters<typeof mapGroup>[0]));
      const ids = mapped.map((group) => group.id);
      const memberResult = ids.length ? await client.from("group_members").select("group_id").in("group_id", ids) : { data: [], error: null };
      const counts = new Map<string, number>();
      for (const member of memberResult.data ?? []) counts.set(member.group_id, (counts.get(member.group_id) ?? 0) + 1);
      setGroups(mapped.map((group) => ({ ...group, memberCount: counts.get(group.id) ?? 0 })));
      setLoading(false);
    });
  }, [user]);

  return (
    <GroupShell>
      <section className="groups-dashboard-hero">
        <div><span className="group-kicker"><UsersRound size={15} />GROUP TRIP MATCH</span><h1>{groupText(locale, "不同护照，找到同一个目的地。", "Different passports. One place that works for everyone.")}</h1><p>{groupText(locale, "把 2–10 位旅行者的护照放在一起，立即找出全员都方便入境的国家。", "Compare 2–10 passports and find destinations every traveler can enter with less friction.")}</p></div>
        <div className="groups-dashboard-actions"><Link href={user ? "/groups/new" : "/account?mode=signup&next=/groups/new"}><Plus size={17} />{groupText(locale, "创建旅行小组", "Create a travel group")}</Link><Link href="/groups/demo"><Sparkles size={17} />{groupText(locale, "查看三人示例", "Open three-person demo")}</Link></div>
      </section>

      <section className="groups-how-it-works">
        <div><span>01</span><strong>{groupText(locale, "加入不同护照", "Add every passport")}</strong><small>{groupText(locale, "手动添加，或发送一次性邀请让朋友认领。", "Add members yourself or let friends claim an invitation.")}</small></div>
        <div><span>02</span><strong>{groupText(locale, "设定共同偏好", "Set shared preferences")}</strong><small>{groupText(locale, "旅行月份、天数、地区和可接受的签证难度。", "Choose month, length, regions, and acceptable visa effort.")}</small></div>
        <div><span>03</span><strong>{groupText(locale, "在地图上做决定", "Decide on the map")}</strong><small>{groupText(locale, "比较全员要求、投票并下载共同目的地海报。", "Compare every traveler, vote, and share the result poster.")}</small></div>
      </section>

      <section className="groups-list-section">
        <header><div><span className="group-kicker">YOUR GROUPS</span><h2>{groupText(locale, "旅行小组", "Travel groups")}</h2></div>{user && <Link href="/groups/new"><Plus size={15} />{groupText(locale, "新建", "New group")}</Link>}</header>
        {authLoading || loading ? <div className="groups-empty"><Globe2 size={21} /><strong>{groupText(locale, "正在加载…", "Loading...")}</strong></div> : !configured || !user ? (
          <div className="groups-account-gate"><LockKeyhole size={22} /><div><strong>{groupText(locale, "登录后保存和邀请", "Sign in to save and invite")}</strong><p>{groupText(locale, "匿名示例无需登录；创建小组、投票和跨设备同步需要邮箱账号。", "The demo is open to everyone. An email account is needed to create groups, vote, and sync across devices.")}</p></div><Link href="/account?mode=signin&next=/groups">{groupText(locale, "登录或创建账号", "Sign in or create account")}<ArrowRight size={16} /></Link></div>
        ) : error ? <div className="groups-empty error">{error}</div> : groups.length ? (
          <div className="groups-list">{groups.map((group) => <Link href={`/groups/${group.id}`} key={group.id}><span className="groups-list-icon"><UsersRound size={19} /></span><span><strong>{group.name}</strong><small>{group.memberCount} {groupText(locale, "位旅行者", "travelers")}</small></span><span><CalendarDays size={14} />{group.preferences.travelMonth || groupText(locale, "月份待定", "Month not set")}</span><span>{group.preferences.tripDays} {groupText(locale, "天", "days")}</span><ArrowRight size={17} /></Link>)}</div>
        ) : <div className="groups-empty"><UsersRound size={22} /><strong>{groupText(locale, "还没有旅行小组", "No travel groups yet")}</strong><span>{groupText(locale, "建立第一个小组，看看大家能一起去哪里。", "Create your first group and see where everyone can go.")}</span><Link href="/groups/new">{groupText(locale, "创建小组", "Create group")}<ArrowRight size={15} /></Link></div>}
      </section>
    </GroupShell>
  );
}

