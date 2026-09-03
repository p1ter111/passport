"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, KeyRound, LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { GroupShell, groupText } from "./group-shell";
import { useSiteLanguage } from "./site-language";

export function GroupInvite({ token }: { token: string }) {
  const locale = useSiteLanguage();
  const { configured, loading, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [groupId, setGroupId] = useState("");

  const claim = async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !user) return;
    setBusy(true);
    setError("");
    const { data, error: claimError } = await client.rpc("claim_group_invite", { raw_token: token });
    setBusy(false);
    if (claimError) setError(claimError.message);
    else setGroupId(String(data));
  };

  return <GroupShell backHref="/groups"><section className="group-invite-page"><span className="group-invite-mark">{groupId ? <CheckCircle2 size={26} /> : <UserPlus size={25} />}</span><small>GROUP INVITATION</small><h1>{groupId ? groupText(locale, "你已经加入旅行小组", "You joined the travel group") : groupText(locale, "朋友邀请你一起选目的地", "A friend invited you to choose a destination")}</h1><p>{groupId ? groupText(locale, "现在可以查看全员签证矩阵、投票并加入共同候选。", "You can now inspect the group visa matrix, vote, and build the shared shortlist.") : groupText(locale, "为了保护小组成员信息，请先使用邮箱账号登录，然后认领属于你的成员位置。", "To protect member information, sign in with an email account before claiming your traveler place.")}</p>{error && <div className="group-invite-error" role="alert"><Clock3 size={16} />{error}</div>}{groupId ? <Link href={`/groups/${groupId}`}>{groupText(locale, "打开旅行小组", "Open travel group")}<ArrowRight size={17} /></Link> : loading ? <button type="button" disabled><LoaderCircle className="spin" size={17} />{groupText(locale, "正在检查账号…", "Checking account...")}</button> : !configured ? <div className="group-invite-error"><KeyRound size={16} />{groupText(locale, "账号服务尚未配置，暂时无法使用邀请。", "The account service is not configured, so this invitation cannot be claimed yet.")}</div> : user ? <button type="button" onClick={claim} disabled={busy}>{busy ? groupText(locale, "正在加入…", "Joining...") : groupText(locale, "认领并加入小组", "Claim place and join")}<ArrowRight size={17} /></button> : <Link href={`/account?mode=signin&next=${encodeURIComponent(`/invite/${token}`)}`}>{groupText(locale, "登录或创建账号", "Sign in or create account")}<ArrowRight size={17} /></Link>}<span className="group-invite-security"><KeyRound size={14} />{groupText(locale, "邀请 7 天有效，仅可使用一次。", "Invitations expire after 7 days and can only be used once.")}</span></section></GroupShell>;
}

