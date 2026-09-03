import type { Metadata } from "next";
import { GroupsDashboard } from "@/components/groups-dashboard";

export const metadata: Metadata = { title: "Group Trip Match | Passport Atlas", description: "Find destinations that work for every passport in your group." };
export default function GroupsPage() { return <GroupsDashboard />; }

