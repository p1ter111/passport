"use client";

import { Info, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { DestinationVote, GroupMember, GroupPreferences } from "@/types/group-trip";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GroupMatchResults } from "./group-match-results";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

type SharedData = {
  group: { id: string; name: string; preferences: GroupPreferences; created_at: string; updated_at: string };
  members: Array<{ id: string; display_name: string; passport_iso3: string; role: "owner" | "member" }>;
  votes: Array<{ destination_iso3: string; value: -1 | 1 }>;
};

export function GroupShare({ token }: { token: string }) {
  const locale = useSiteLanguage();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError(groupText(locale, "分享服务尚未配置。", "The sharing service is not configured."));
      return;
    }
    client.rpc("get_shared_group", { raw_share_token: token }).then(({ data: sharedData, error: shareError }) => {
      if (shareError || !sharedData) setError(shareError?.message ?? groupText(locale, "分享链接无效。", "This share link is invalid."));
      else setData(sharedData as SharedData);
    });
  }, [locale, token]);

  if (error) return <GroupShell backHref="/groups"><div className="group-results-state error"><Info size={20} /><strong>{groupText(locale, "无法打开分享结果", "Unable to open shared results")}</strong><span>{error}</span></div></GroupShell>;
  if (!data) return <GroupShell backHref="/groups"><div className="group-results-state"><LoaderCircle className="spin" size={22} />{groupText(locale, "正在加载共同目的地…", "Loading shared destinations...")}</div></GroupShell>;
  const members: GroupMember[] = data.members.map((member, index) => ({ id: member.id, groupId: data.group.id, userId: null, displayName: member.display_name, passportIso3: member.passport_iso3, role: member.role, createdAt: data.group.created_at }));
  const votes: DestinationVote[] = data.votes.map((vote, index) => ({ groupId: data.group.id, destinationIso3: vote.destination_iso3, userId: `anonymous-${index}`, value: vote.value, createdAt: data.group.updated_at }));
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  return <GroupShell backHref="/groups"><div className="group-demo-notice shared"><span>READ-ONLY SHARE</span><p>{groupText(locale, "这是小组公开分享的只读结果，不包含成员邮箱或账号信息。", "This is a read-only group result. Member email and account details are never included.")}</p></div><GroupMatchResults groupName={data.group.name} members={members} preferences={data.group.preferences} votes={votes} readOnly shareUrl={shareUrl} /></GroupShell>;
}
