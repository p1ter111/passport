import type { Metadata } from "next";
import { PassportRankings } from "@/components/passport-rankings";

export const metadata: Metadata = {
  title: "Passport Rankings | Passport Atlas",
  description: "搜索、筛选并比较全球护照通行能力、免签目的地和旅行自由度。",
};

export default function RankingsPage() {
  return <PassportRankings />;
}
