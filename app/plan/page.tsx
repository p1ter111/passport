import { redirect } from "next/navigation";
import { TripPlanner } from "@/components/trip-planner";
import { allCountries, getVisaRules } from "@/lib/passport-data";
import type { VisaRule } from "@/types/visa";

type PlanPageProps = {
  searchParams: Promise<{ from?: string; to?: string; days?: string; date?: string; purpose?: string; transit?: string; city?: string }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const origin = allCountries.find((country) => country.iso3 === params.from?.toUpperCase());
  const destination = allCountries.find((country) => country.iso3 === params.to?.toUpperCase());

  if (!origin || !destination) redirect("/");

  const rule: VisaRule = origin.iso2 === destination.iso2
    ? { status: "-1" }
    : getVisaRules(origin.iso2)?.[destination.iso2] ?? { status: "unknown" };

  const requestedDays = Number(params.days);
  const allowedPurposes = new Set(["tourism", "business", "study", "visit"]);
  return (
    <TripPlanner
      origin={origin}
      destination={destination}
      rule={rule}
      initialPlan={{
        tripDays: Number.isFinite(requestedDays) ? Math.min(365, Math.max(1, requestedDays)) : undefined,
        departureDate: params.date ?? "",
        purpose: params.purpose && allowedPurposes.has(params.purpose) ? params.purpose : "tourism",
        transitIso3: params.transit?.toUpperCase() ?? "",
        destinationCity: params.city ?? "",
      }}
    />
  );
}
