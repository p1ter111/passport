"use client";

import { useState } from "react";
import type { DestinationVote, GroupMember, GroupPreferences } from "@/types/group-trip";
import { GroupMatchResults } from "./group-match-results";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

const demoMembers: GroupMember[] = [
  { id: "demo-cn", groupId: "demo", userId: "demo-user", displayName: "Lin", passportIso3: "CHN", role: "owner", createdAt: "2026-09-02T00:00:00Z" },
  { id: "demo-jp", groupId: "demo", userId: null, displayName: "Aoi", passportIso3: "JPN", role: "member", createdAt: "2026-09-02T00:01:00Z" },
  { id: "demo-tr", groupId: "demo", userId: null, displayName: "Deniz", passportIso3: "TUR", role: "member", createdAt: "2026-09-02T00:02:00Z" },
];

const demoPreferences: GroupPreferences = {
  travelMonth: "2026-10",
  tripDays: 7,
  regions: [],
  visaTolerance: "evisa",
  includeVisaRequired: false,
};

export function GroupDemo() {
  const locale = useSiteLanguage();
  const [votes, setVotes] = useState<DestinationVote[]>([]);
  const vote = (destinationIso3: string, value: -1 | 1) => setVotes((current) => {
    const existing = current.find((item) => item.destinationIso3 === destinationIso3);
    if (existing?.value === value) return current.filter((item) => item.destinationIso3 !== destinationIso3);
    return [...current.filter((item) => item.destinationIso3 !== destinationIso3), { groupId: "demo", destinationIso3, userId: "demo-user", value, createdAt: new Date().toISOString() }];
  });
  return <GroupShell backHref="/groups" backLabel={groupText(locale, "多人匹配", "Group Match")}><div className="group-demo-notice"><span>LIVE DEMO</span><p>{groupText(locale, "这是中国、日本和土耳其护照的匿名示例。投票只保留到刷新页面；登录后可创建真实小组并邀请朋友。", "This anonymous demo combines Chinese, Japanese, and Turkish passports. Votes reset on refresh; sign in to create a real group and invite friends.")}</p></div><GroupMatchResults groupName={groupText(locale, "十月共同旅行", "October together")} members={demoMembers} preferences={demoPreferences} votes={votes} currentUserId="demo-user" onVote={vote} /></GroupShell>;
}

