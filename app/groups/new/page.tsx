import type { Metadata } from "next";
import { GroupCreate } from "@/components/group-create";

export const metadata: Metadata = { title: "Create Group | Passport Atlas" };
export default function NewGroupPage() { return <GroupCreate />; }

