import type { Metadata } from "next";
import { GroupInvite } from "@/components/group-invite";

export const metadata: Metadata = { title: "Group Invitation | Passport Atlas" };
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <GroupInvite token={token} />; }

