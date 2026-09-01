import { readFileSync } from "node:fs";
import path from "node:path";
import countriesData from "@/data/countries.json";
import type { CountryProfile } from "@/types/passport";
import type { VisaRules } from "@/types/visa";

export const allCountries = countriesData as CountryProfile[];
const passportIndex = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "passport-index.json"), "utf8"),
) as Record<string, VisaRules>;

export function getCountryByIso3(iso3: string) {
  return allCountries.find((country) => country.iso3.toLowerCase() === iso3.toLowerCase());
}

export function getVisaRules(iso2: string): VisaRules | undefined {
  return passportIndex[iso2.toUpperCase()];
}
