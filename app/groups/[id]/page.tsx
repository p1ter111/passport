import type { Metadata } from "next";
import { GroupDetail } from "@/components/group-detail";

export const metadata: Metadata = { title: "Travel Group | Passport Atlas" };
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <GroupDetail groupId={id} />; }

