import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PassportDetail } from "@/components/passport-detail";
import { allCountries, getCountryByIso3, getVisaRules } from "@/lib/passport-data";

type PassportPageProps = {
  params: Promise<{ iso3: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return allCountries.map((country) => ({ iso3: country.iso3.toLowerCase() }));
}

export async function generateMetadata({ params }: PassportPageProps): Promise<Metadata> {
  const { iso3 } = await params;
  const country = getCountryByIso3(iso3);
  if (!country) return { title: "Passport not found | Passport Atlas" };
  return {
    title: `${country.nameZh}护照 · 全球通行地图 | Passport Atlas`,
    description: `查看${country.nameZh}护照的全球排名、免签、落地签、电子签和需签证目的地。`,
  };
}

export default async function PassportPage({ params }: PassportPageProps) {
  const { iso3 } = await params;
  const country = getCountryByIso3(iso3);
  if (!country) notFound();
  const visaRules = getVisaRules(country.iso2);
  if (!visaRules) notFound();

  return <PassportDetail country={country} visaRules={visaRules} />;
}
