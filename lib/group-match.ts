import countriesData from "../data/countries.json";
import passportIndexData from "../data/passport-index.json";
import visaDataMeta from "../data/visa-data-meta.json";
import type { CountryProfile, Region } from "@/types/passport";
import type {
  GroupDestinationMatch,
  GroupMatchRequest,
  GroupMatchResponse,
  GroupMemberVisaResult,
  VisaTolerance,
} from "@/types/group-trip";
import type { VisaRule, VisaRules, VisaStatus } from "@/types/visa";

const countries = countriesData as CountryProfile[];
const passportIndex = passportIndexData as Record<string, VisaRules>;

export const visaStatusWeights: Record<VisaStatus, number> = {
  "-1": 100,
  "visa free": 100,
  eta: 90,
  "visa on arrival": 80,
  "e-visa": 65,
  "visa required": 20,
  unknown: 10,
  "no admission": 0,
};

const toleranceStatuses: Record<VisaTolerance, Set<VisaStatus>> = {
  "visa-free": new Set(["-1", "visa free"]),
  arrival: new Set(["-1", "visa free", "eta", "visa on arrival"]),
  evisa: new Set(["-1", "visa free", "eta", "visa on arrival", "e-visa"]),
};

function normalizeDays(days: VisaRule["days"]): number | null {
  if (typeof days === "number" && Number.isFinite(days)) return days;
  if (typeof days !== "string") return null;
  const value = Number.parseInt(days.match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(value) ? value : null;
}

function getRule(origin: CountryProfile, destination: CountryProfile): VisaRule {
  if (origin.iso2 === destination.iso2) return { status: "-1" };
  return passportIndex[origin.iso2]?.[destination.iso2] ?? { status: "unknown" };
}

function isStatusAllowed(status: VisaStatus, tolerance: VisaTolerance, includeVisaRequired: boolean) {
  if (status === "no admission" || status === "unknown") return false;
  if (status === "visa required") return includeVisaRequired;
  return toleranceStatuses[tolerance].has(status);
}

function compareMatches(left: GroupDestinationMatch, right: GroupDestinationMatch) {
  if (left.groupScore !== right.groupScore) return right.groupScore - left.groupScore;
  if (left.commonStayDays !== right.commonStayDays) {
    return (right.commonStayDays ?? -1) - (left.commonStayDays ?? -1);
  }
  const leftName = countries.find((country) => country.iso3 === left.destinationIso3)?.name ?? left.destinationIso3;
  const rightName = countries.find((country) => country.iso3 === right.destinationIso3)?.name ?? right.destinationIso3;
  return leftName.localeCompare(rightName, "en", { sensitivity: "base" });
}

export function validateGroupMatchRequest(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid request body.";
  const request = value as Partial<GroupMatchRequest>;
  if (!Array.isArray(request.members) || request.members.length < 2 || request.members.length > 10) {
    return "A group must contain 2 to 10 members.";
  }
  if (request.members.some((member) => !member?.id || !member.name?.trim() || !countries.some((country) => country.iso3 === member.passportIso3))) {
    return "Every member must have a name and a valid passport.";
  }
  const preferences = request.preferences;
  if (!preferences || !Number.isInteger(preferences.tripDays) || preferences.tripDays < 1 || preferences.tripDays > 365) {
    return "Trip length must be between 1 and 365 days.";
  }
  if (!Object.hasOwn(toleranceStatuses, preferences.visaTolerance)) return "Invalid visa tolerance.";
  if (!Array.isArray(preferences.regions)) return "Regions must be an array.";
  const knownRegions = new Set(countries.map((country) => country.region));
  if (preferences.regions.some((region) => !knownRegions.has(region as Region))) return "Unknown region.";
  return null;
}

export function matchGroupDestinations(request: GroupMatchRequest): GroupMatchResponse {
  const origins = request.members.map((member) => ({
    member,
    country: countries.find((country) => country.iso3 === member.passportIso3)!,
  }));
  const regionFilter = new Set(request.preferences.regions);
  const destinations = regionFilter.size > 0
    ? countries.filter((country) => regionFilter.has(country.region))
    : countries;
  const matches: GroupDestinationMatch[] = [];

  for (const destination of destinations) {
    const memberRules: GroupMemberVisaResult[] = origins.map(({ member, country }) => {
      const rule = getRule(country, destination);
      const days = normalizeDays(rule.days);
      return {
        memberId: member.id,
        memberName: member.name,
        passportIso3: member.passportIso3,
        status: rule.status,
        days: rule.days ?? null,
        score: visaStatusWeights[rule.status],
        stayFits: days === null ? null : days >= request.preferences.tripDays,
      };
    });
    const statusAllowed = memberRules.every((rule) => isStatusAllowed(
      rule.status,
      request.preferences.visaTolerance,
      request.preferences.includeVisaRequired,
    ));
    const knownStayTooShort = memberRules.some((rule) => rule.stayFits === false);
    if (!statusAllowed || knownStayTooShort) continue;

    const scores = memberRules.map((rule) => rule.score);
    const weakestScore = Math.min(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const knownStayDays = memberRules
      .map((rule) => normalizeDays(rule.days))
      .filter((days): days is number => days !== null);
    const commonStayDays = knownStayDays.length > 0 ? Math.min(...knownStayDays) : null;
    const worstRule = [...memberRules].sort((left, right) => left.score - right.score)[0];

    matches.push({
      destinationIso3: destination.iso3,
      destinationIso2: destination.iso2,
      groupScore: Math.round(weakestScore * 0.7 + averageScore * 0.3),
      commonStayDays,
      stayDataComplete: knownStayDays.length === memberRules.length,
      worstStatus: worstRule.status,
      requiresTraditionalVisa: memberRules.some((rule) => rule.status === "visa required"),
      members: memberRules,
    });
  }

  matches.sort(compareMatches);
  return {
    matches,
    totalEvaluated: destinations.length,
    hiddenCount: destinations.length - matches.length,
    dataSnapshot: visaDataMeta.snapshotDate,
    dataSourceName: visaDataMeta.sourceName,
    dataSourceUrl: visaDataMeta.sourceUrl,
    recommendedRefreshDays: visaDataMeta.recommendedRefreshDays,
    staleAfterDays: visaDataMeta.staleAfterDays,
  };
}
