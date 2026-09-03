import type { Metadata } from "next";
import { GroupShare } from "@/components/group-share";

export const metadata: Metadata = { title: "Shared Group Match | Passport Atlas", robots: { index: false, follow: false } };
export default async function SharedGroupPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <GroupShare token={token} />; }
