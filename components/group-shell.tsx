"use client";

import Link from "next/link";
import { ArrowLeft, Globe2, LogIn, UserRound, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { isRtlLocale, useSiteLanguage } from "./site-language";
import { toTraditional } from "@/lib/i18n";

export function groupText(locale: string, chinese: string, english: string) {
  return locale === "zh-TW" ? toTraditional(chinese) : locale === "zh" ? chinese : english;
}

export function GroupShell({ children, backHref = "/explore", backLabel }: { children: ReactNode; backHref?: string; backLabel?: string }) {
  const locale = useSiteLanguage();
  const { user } = useAuth();
  const showBackLink = backHref !== "/groups";
  return (
    <main className="group-page" dir={isRtlLocale(locale) ? "rtl" : "ltr"}>
      <header className="group-header">
        <Link className="brand" href="/"><span className="brand-mark"><Globe2 size={21} /></span><span>Passport <strong>Atlas</strong></span></Link>
        <nav aria-label={groupText(locale, "多人匹配", "Group Match")}>
          {showBackLink && <Link href={backHref}><ArrowLeft size={15} />{backLabel ?? groupText(locale, "返回探索", "Back to Explore")}</Link>}
          <Link className="group-header-active" href="/groups"><UsersRound size={15} />{groupText(locale, "多人匹配", "Group Match")}</Link>
          <Link href="/account">{user ? <UserRound size={15} /> : <LogIn size={15} />}{user ? groupText(locale, "账号", "Account") : groupText(locale, "登录", "Sign in")}</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
