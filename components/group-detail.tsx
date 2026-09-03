"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, Copy, Link2, LoaderCircle, Plus, Settings2, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import countriesData from "@/data/countries.json";
import type { CountryProfile, Region } from "@/types/passport";
import type { DestinationVote, GroupMember, GroupPreferences, TravelGroup, VisaTolerance } from "@/types/group-trip";
import { getCountryName } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadTravelGroup, mapMember, mapVote, sha256 } from "@/lib/group-service";
import { useAuth } from "./auth-provider";
import { GroupMatchResults } from "./group-match-results";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

const countries = [...countriesData as CountryProfile[]].sort((left, right) => left.name.localeCompare(right.name, "en"));
const regions = Array.from(new Set(countries.map((country) => country.region)));

function randomInviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function GroupDetail({ groupId }: { groupId: string }) {
  const locale = useSiteLanguage();
  const { configured, loading: authLoading, user } = useAuth();
  const [group, setGroup] = useState<TravelGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [votes, setVotes] = useState<DestinationVote[]>([]);
  const [invites, setInvites] = useState<Array<{ id: string; member_id: string; expires_at: string }>>([]);
  const [error, setError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPassport, setNewMemberPassport] = useState("SGP");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !user) return;
    try {
      const data = await loadTravelGroup(client, groupId);
      setGroup(data.group);
      setMembers(data.members);
      setVotes(data.votes);
      setInvites(data.invites);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this group.");
    }
  }, [groupId, user]);

  useEffect(() => { refresh(); }, [refresh]);
  const isOwner = Boolean(group && user && group.ownerId === user.id);

  const onVote = async (destinationIso3: string, value: -1 | 1) => {
    const client = getSupabaseBrowserClient();
    if (!client || !user || !group) return;
    const existing = votes.find((vote) => vote.destinationIso3 === destinationIso3 && vote.userId === user.id);
    if (existing?.value === value) {
      const { error: voteError } = await client.from("destination_votes").delete().eq("group_id", group.id).eq("destination_iso3", destinationIso3).eq("user_id", user.id);
      if (!voteError) setVotes((current) => current.filter((vote) => !(vote.destinationIso3 === destinationIso3 && vote.userId === user.id)));
      return;
    }
    const { data, error: voteError } = await client.from("destination_votes").upsert({ group_id: group.id, destination_iso3: destinationIso3, user_id: user.id, value }, { onConflict: "group_id,destination_iso3,user_id" }).select("*").single();
    if (!voteError && data) setVotes((current) => [...current.filter((vote) => !(vote.destinationIso3 === destinationIso3 && vote.userId === user.id)), mapVote(data as Parameters<typeof mapVote>[0])]);
  };

  const createInvite = async (member: GroupMember) => {
    const client = getSupabaseBrowserClient();
    if (!client || !user || !group) return;
    setBusy(true);
    const token = randomInviteToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await client.from("group_invites").update({ revoked_at: new Date().toISOString() }).eq("member_id", member.id).is("used_at", null).is("revoked_at", null);
    const { data, error: inviteError } = await client.from("group_invites").insert({ group_id: group.id, member_id: member.id, token_hash: tokenHash, created_by: user.id, expires_at: expiresAt }).select("id,member_id,expires_at").single();
    setBusy(false);
    if (inviteError) {
      setError(inviteError.message);
      return;
    }
    setInvites((current) => [...current.filter((invite) => invite.member_id !== member.id), data]);
    setInviteUrl(`${window.location.origin}/invite/${token}`);
  };

  const revokeInvite = async (memberId: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { error: revokeError } = await client.from("group_invites").update({ revoked_at: new Date().toISOString() }).eq("member_id", memberId).is("used_at", null).is("revoked_at", null);
    if (!revokeError) {
      setInvites((current) => current.filter((invite) => invite.member_id !== memberId));
      setInviteUrl("");
    }
  };

  const copyValue = async (value: string, type: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const addMember = async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !group || !newMemberName.trim() || members.length >= 10) return;
    setBusy(true);
    const { data, error: memberError } = await client.from("group_members").insert({ group_id: group.id, display_name: newMemberName.trim(), passport_iso3: newMemberPassport, role: "member" }).select("*").single();
    setBusy(false);
    if (memberError) setError(memberError.message);
    else {
      setMembers((current) => [...current, mapMember(data as Parameters<typeof mapMember>[0])]);
      setNewMemberName("");
    }
  };

  const removeMember = async (member: GroupMember) => {
    const client = getSupabaseBrowserClient();
    if (!client || member.role === "owner") return;
    const { error: removeError } = await client.from("group_members").delete().eq("id", member.id);
    if (!removeError) setMembers((current) => current.filter((item) => item.id !== member.id));
  };

  const updatePreferences = async (next: GroupPreferences) => {
    const client = getSupabaseBrowserClient();
    if (!client || !group) return;
    setGroup({ ...group, preferences: next });
    const { error: updateError } = await client.from("travel_groups").update({ preferences: next }).eq("id", group.id);
    if (updateError) {
      setError(updateError.message);
      refresh();
    }
  };

  if (authLoading) return <GroupShell backHref="/groups"><div className="group-results-state"><LoaderCircle className="spin" size={22} />Passport Atlas</div></GroupShell>;
  if (!configured || !user) return <GroupShell backHref="/groups"><div className="groups-account-gate standalone"><UserPlus size={22} /><div><strong>{groupText(locale, "登录后查看旅行小组", "Sign in to open this group")}</strong><p>{groupText(locale, "小组成员和投票只对已加入的账号开放。", "Members and votes are only visible to accounts that belong to the group.")}</p></div><Link href={`/account?mode=signin&next=${encodeURIComponent(`/groups/${groupId}`)}`}>{groupText(locale, "登录", "Sign in")}<ArrowRight size={16} /></Link></div></GroupShell>;
  if (error && !group) return <GroupShell backHref="/groups"><div className="group-results-state error"><strong>{groupText(locale, "无法打开这个小组", "Unable to open this group")}</strong><span>{error}</span></div></GroupShell>;
  if (!group) return <GroupShell backHref="/groups"><div className="group-results-state"><LoaderCircle className="spin" size={22} />{groupText(locale, "正在加载小组…", "Loading group...")}</div></GroupShell>;

  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/share/group/${group.shareToken}`;
  return (
    <GroupShell backHref="/groups" backLabel={groupText(locale, "我的旅行小组", "My groups")}>
      <div className="group-detail-toolbar">
        <div>{members.map((member) => <span key={member.id} title={member.displayName}>{countries.find((country) => country.iso3 === member.passportIso3)?.flag}</span>)}<small>{members.length}/10</small></div>
        <div><button type="button" onClick={() => copyValue(shareUrl, "share")}><Link2 size={15} />{copied === "share" ? groupText(locale, "已复制", "Copied") : groupText(locale, "只读分享", "Share result")}</button>{isOwner && <button type="button" onClick={() => setManageOpen(true)}><Settings2 size={15} />{groupText(locale, "管理小组", "Manage group")}</button>}</div>
      </div>
      {error && <div className="group-inline-error" role="alert">{error}<button onClick={() => setError("")} type="button"><X size={14} /></button></div>}
      <GroupMatchResults groupName={group.name} members={members} preferences={group.preferences} votes={votes} currentUserId={user.id} shareUrl={shareUrl} onVote={onVote} />
      {manageOpen && <GroupManageDialog group={group} members={members} invites={invites} locale={locale} busy={busy} inviteUrl={inviteUrl} copied={copied} newMemberName={newMemberName} newMemberPassport={newMemberPassport} setNewMemberName={setNewMemberName} setNewMemberPassport={setNewMemberPassport} addMember={addMember} removeMember={removeMember} createInvite={createInvite} revokeInvite={revokeInvite} copyValue={copyValue} updatePreferences={updatePreferences} onClose={() => { setManageOpen(false); setInviteUrl(""); }} />}
    </GroupShell>
  );
}

type ManageProps = {
  group: TravelGroup; members: GroupMember[]; invites: Array<{ id: string; member_id: string; expires_at: string }>;
  locale: string; busy: boolean; inviteUrl: string; copied: string; newMemberName: string; newMemberPassport: string;
  setNewMemberName: (value: string) => void; setNewMemberPassport: (value: string) => void; addMember: () => void;
  removeMember: (member: GroupMember) => void; createInvite: (member: GroupMember) => void; revokeInvite: (memberId: string) => void;
  copyValue: (value: string, type: string) => void; updatePreferences: (preferences: GroupPreferences) => void; onClose: () => void;
};

function GroupManageDialog(props: ManageProps) {
  const { group, members, invites, locale } = props;
  const toggleRegion = (region: Region) => props.updatePreferences({ ...group.preferences, regions: group.preferences.regions.includes(region) ? group.preferences.regions.filter((item) => item !== region) : [...group.preferences.regions, region] });
  return <div className="group-manage-backdrop" role="presentation" onMouseDown={props.onClose}><section className="group-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="group-manage-title" onMouseDown={(event) => event.stopPropagation()}><header><div><small>GROUP SETTINGS</small><h2 id="group-manage-title">{groupText(locale, "管理旅行小组", "Manage travel group")}</h2></div><button type="button" onClick={props.onClose}><X size={18} /></button></header><div className="group-manage-scroll"><section><h3>{groupText(locale, "成员与邀请", "Travelers and invitations")}</h3><div className="group-manage-members">{members.map((member) => { const passport = countries.find((country) => country.iso3 === member.passportIso3); const invite = invites.find((item) => item.member_id === member.id); return <div key={member.id}><span>{passport?.flag}</span><span><strong>{member.displayName}</strong><small>{passport?.iso3} · {member.userId ? groupText(locale, "已认领", "Joined") : groupText(locale, "待认领", "Unclaimed")}</small></span>{member.role === "owner" ? <em>OWNER</em> : member.userId ? <Check size={16} /> : invite ? <button type="button" onClick={() => props.revokeInvite(member.id)}><Clock3 size={14} />{groupText(locale, "撤销邀请", "Revoke")}</button> : <button type="button" onClick={() => props.createInvite(member)} disabled={props.busy}><Link2 size={14} />{groupText(locale, "生成邀请", "Invite")}</button>}{member.role !== "owner" && <button className="danger" type="button" onClick={() => props.removeMember(member)} aria-label={groupText(locale, "移除成员", "Remove member")}><Trash2 size={14} /></button>}</div>; })}</div>{props.inviteUrl && <div className="group-invite-created"><span>{props.inviteUrl}</span><button type="button" onClick={() => props.copyValue(props.inviteUrl, "invite")}><Copy size={14} />{props.copied === "invite" ? groupText(locale, "已复制", "Copied") : groupText(locale, "复制链接", "Copy link")}</button><small>{groupText(locale, "该链接 7 天内有效，只能使用一次。关闭后原始链接无法再次显示。", "This link expires in 7 days and works once. The raw link cannot be shown again after closing.")}</small></div>}<div className="group-manage-add"><input value={props.newMemberName} onChange={(event) => props.setNewMemberName(event.target.value)} placeholder={groupText(locale, "成员名字", "Traveler name")} maxLength={60} /><select value={props.newMemberPassport} onChange={(event) => props.setNewMemberPassport(event.target.value)}>{countries.map((country) => <option key={country.iso3} value={country.iso3}>{country.flag} {getCountryName(country, locale)}</option>)}</select><button type="button" onClick={props.addMember} disabled={props.busy || members.length >= 10 || !props.newMemberName.trim()}><Plus size={15} />{groupText(locale, "添加", "Add")}</button></div></section><section><h3>{groupText(locale, "匹配偏好", "Matching preferences")}</h3><div className="group-manage-preferences"><label><span>{groupText(locale, "旅行月份", "Travel month")}</span><input type="month" value={group.preferences.travelMonth} onChange={(event) => props.updatePreferences({ ...group.preferences, travelMonth: event.target.value })} /></label><label><span>{groupText(locale, "旅行天数", "Trip days")}</span><input type="number" min={1} max={365} value={group.preferences.tripDays} onChange={(event) => props.updatePreferences({ ...group.preferences, tripDays: Math.min(365, Math.max(1, Number(event.target.value))) })} /></label><label><span>{groupText(locale, "最高签证难度", "Visa effort")}</span><select value={group.preferences.visaTolerance} onChange={(event) => props.updatePreferences({ ...group.preferences, visaTolerance: event.target.value as VisaTolerance })}><option value="visa-free">{groupText(locale, "仅免签", "Visa free only")}</option><option value="arrival">{groupText(locale, "ETA / 落地签", "ETA / arrival")}</option><option value="evisa">{groupText(locale, "电子签", "E-visa")}</option></select></label></div><div className="group-manage-regions">{regions.map((region) => <button type="button" key={region} className={group.preferences.regions.includes(region) ? "active" : ""} onClick={() => toggleRegion(region)}>{group.preferences.regions.includes(region) && <Check size={12} />}{region}</button>)}</div><label className="group-manage-switch"><input type="checkbox" checked={group.preferences.includeVisaRequired} onChange={(event) => props.updatePreferences({ ...group.preferences, includeVisaRequired: event.target.checked })} /><span /><div><strong>{groupText(locale, "包含需要传统签证的目的地", "Include traditional visa destinations")}</strong><small>{groupText(locale, "默认关闭；开启后这些国家会降分显示。", "Off by default; these destinations appear with a lower score.")}</small></div></label></section></div></section></div>;
}
