import historySourcesData from "@/data/passport-history-sources.json";
import type { CountryProfile } from "@/types/passport";

export type PassportHistoryChangeCategory = "design" | "security" | "identity" | "standards";

export type LocalizedHistoryText = {
  en: string;
  zh: string;
};

export type PassportHistoryChange = {
  category: PassportHistoryChangeCategory;
  detail: LocalizedHistoryText;
};

export type PassportHistoryEntry = {
  year: number;
  period: string;
  title: LocalizedHistoryText;
  description: LocalizedHistoryText;
  changes: PassportHistoryChange[];
  cover: string;
  sourceUrl: string;
  evidenceUrl: string;
  license: string;
  author: string;
  isCurrent?: boolean;
};

const verifiedHistory = historySourcesData as Record<string, PassportHistoryEntry[]>;

export function localizeHistoryText(text: LocalizedHistoryText, locale: string) {
  return locale === "zh" || locale === "zh-TW" ? text.zh : text.en;
}

/**
 * Historical editions are returned only when every image has a traceable
 * source, license and documentary reference. There is deliberately no visual
 * reconstruction fallback: an absent archive is more honest than a fake cover.
 */
export function getPassportHistory(country: CountryProfile): PassportHistoryEntry[] {
  return verifiedHistory[country.iso3] ?? [];
}
