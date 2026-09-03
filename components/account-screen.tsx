"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Globe2, KeyRound, LogOut, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { useSiteLanguage } from "./site-language";
import { toTraditional } from "@/lib/i18n";

type AccountMode = "signin" | "signup" | "forgot" | "recovery";

function text(locale: string, chinese: string, english: string) {
  return locale === "zh-TW" ? toTraditional(chinese) : locale === "zh" ? chinese : english;
}

export function AccountScreen({ initialMode = "signin", nextPath = "/groups" }: { initialMode?: AccountMode; nextPath?: string }) {
  const locale = useSiteLanguage();
  const { configured, loading, user, signIn, signUp, requestPasswordReset, updatePassword, signOut } = useAuth();
  const [mode, setMode] = useState<AccountMode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if ((mode === "signup" || mode === "recovery") && password.length < 8) {
      setError(text(locale, "密码至少需要 8 个字符。", "Password must be at least 8 characters."));
      return;
    }
    if ((mode === "signup" || mode === "recovery") && password !== confirmPassword) {
      setError(text(locale, "两次输入的密码不一致。", "Passwords do not match."));
      return;
    }
    setBusy(true);
    if (mode === "forgot") {
      const result = await requestPasswordReset(email);
      setBusy(false);
      if (result.error) setError(result.error);
      else setMessage(text(locale, "重置链接已经发送，请检查邮箱。", "A password reset link has been sent to your email."));
      return;
    }
    if (mode === "recovery") {
      const result = await updatePassword(password);
      setBusy(false);
      if (result.error) setError(result.error);
      else {
        setMessage(text(locale, "密码已更新。", "Your password has been updated."));
        setMode("signin");
      }
      return;
    }
    if (mode === "signup") {
      const result = await signUp(email, password, displayName);
      setBusy(false);
      if (result.error) setError(result.error);
      else if (result.needsEmailConfirmation) setMessage(text(locale, "账号已创建，请先在邮箱中完成验证。", "Account created. Please verify your email before signing in."));
      else window.location.assign(nextPath);
      return;
    }
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    else window.location.assign(nextPath);
  };

  if (!configured) {
    return (
      <main className="account-page">
        <AccountHeader locale={locale} />
        <section className="account-setup-panel">
          <span><ShieldCheck size={22} /></span>
          <small>SUPABASE SETUP REQUIRED</small>
          <h1>{text(locale, "账号服务尚未连接", "Account service is not connected")}</h1>
          <p>{text(locale, "匿名浏览和多人匹配示例仍可使用。配置 Supabase 环境变量并执行数据库迁移后，邮箱账号、邀请和同步会自动启用。", "Anonymous browsing and the group matching demo still work. Add the Supabase environment variables and run the database migration to enable email accounts, invitations, and sync.")}</p>
          <div><Link href="/groups/demo"><UsersRound size={17} />{text(locale, "查看多人匹配示例", "View group matching demo")}</Link><Link href="/groups">{text(locale, "返回多人匹配", "Back to Group Match")}<ArrowRight size={16} /></Link></div>
        </section>
      </main>
    );
  }

  if (loading) return <main className="account-page"><AccountHeader locale={locale} /><div className="account-loading">Passport Atlas</div></main>;

  if (user && mode !== "recovery") {
    return (
      <main className="account-page">
        <AccountHeader locale={locale} />
        <section className="account-profile-panel">
          <span className="account-profile-mark"><CheckCircle2 size={23} /></span>
          <small>{text(locale, "账号已连接", "ACCOUNT CONNECTED")}</small>
          <h1>{user.user_metadata.display_name || user.email?.split("@")[0]}</h1>
          <p>{user.email}</p>
          <div className="account-profile-actions">
            <Link href="/groups"><UsersRound size={17} />{text(locale, "我的旅行小组", "My travel groups")}</Link>
            <Link href="/saved">{text(locale, "个人旅行空间", "Personal travel space")}<ArrowRight size={16} /></Link>
            <button type="button" onClick={signOut}><LogOut size={16} />{text(locale, "退出登录", "Sign out")}</button>
          </div>
        </section>
      </main>
    );
  }

  const title = mode === "signup"
    ? text(locale, "创建你的账号", "Create your account")
    : mode === "forgot"
      ? text(locale, "找回密码", "Reset your password")
      : mode === "recovery"
        ? text(locale, "设置新密码", "Choose a new password")
        : text(locale, "登录 Passport Atlas", "Sign in to Passport Atlas");

  return (
    <main className="account-page">
      <AccountHeader locale={locale} />
      <section className="account-auth-panel">
        <div className="account-auth-heading">
          <span><KeyRound size={20} /></span>
          <small>PERSONAL TRAVEL SPACE</small>
          <h1>{title}</h1>
          <p>{text(locale, "保存小组、邀请朋友，并在所有设备上同步旅行信息。", "Save groups, invite friends, and keep your travel information available across devices.")}</p>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && <label><span>{text(locale, "你的名字", "Your name")}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required maxLength={60} /></label>}
          {mode !== "recovery" && <label><span>{text(locale, "邮箱", "Email")}</span><div><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" required /></div></label>}
          {mode !== "forgot" && <label><span>{mode === "recovery" ? text(locale, "新密码", "New password") : text(locale, "密码", "Password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} /></label>}
          {(mode === "signup" || mode === "recovery") && <label><span>{text(locale, "确认密码", "Confirm password")}</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} /></label>}
          {error && <div className="account-form-message error" role="alert">{error}</div>}
          {message && <div className="account-form-message success" role="status">{message}</div>}
          <button className="account-submit" type="submit" disabled={busy}>{busy ? text(locale, "处理中...", "Working...") : title}<ArrowRight size={17} /></button>
        </form>
        <div className="account-auth-switches">
          {mode === "signin" && <><button type="button" onClick={() => setMode("signup")}>{text(locale, "没有账号？创建一个", "New here? Create an account")}</button><button type="button" onClick={() => setMode("forgot")}>{text(locale, "忘记密码", "Forgot password")}</button></>}
          {mode !== "signin" && mode !== "recovery" && <button type="button" onClick={() => setMode("signin")}>{text(locale, "返回登录", "Back to sign in")}</button>}
        </div>
      </section>
    </main>
  );
}

function AccountHeader({ locale }: { locale: string }) {
  return <header className="account-header"><Link className="brand" href="/"><span className="brand-mark"><Globe2 size={21} /></span><span>Passport <strong>Atlas</strong></span></Link><Link href="/explore"><ArrowLeft size={16} />{text(locale, "返回探索", "Back to Explore")}</Link></header>;
}

