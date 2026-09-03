import type { Metadata } from "next";
import { AccountScreen } from "@/components/account-screen";

export const metadata: Metadata = {
  title: "Account | Passport Atlas",
  description: "Sign in to save travel groups, invitations, passports, and routes.",
};

type AccountPageProps = {
  searchParams: Promise<{ mode?: string; next?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const allowedModes = new Set(["signin", "signup", "forgot", "recovery"]);
  const initialMode = allowedModes.has(params.mode ?? "") ? params.mode as "signin" | "signup" | "forgot" | "recovery" : "signin";
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/groups";
  return <AccountScreen initialMode={initialMode} nextPath={nextPath} />;
}
