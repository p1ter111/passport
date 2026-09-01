import type { Metadata } from "next";
import { PassportLibrary } from "@/components/passport-library";

export const metadata: Metadata = {
  title: "My Passport List | Passport Atlas",
  description: "Your saved passports, recent views, and travel routes.",
};

export default function SavedPage() {
  return <PassportLibrary />;
}
