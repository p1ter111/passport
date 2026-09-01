import type { CountryProfile } from "@/types/passport";

export type PassportHistoryEntry = {
  year: number;
  title: string;
  description: string;
  titleKey?: "historyMachineReadableTitle" | "historyEpassportTitle" | "historyBiometricTitle" | "historyCurrentTitle";
  descriptionKey?: "historyMachineReadableDescription" | "historyEpassportDescription" | "historyBiometricDescription" | "historyCurrentDescription";
  cover?: string;
  /** Uses the country's verified current cover as the base for a visual archive reconstruction. */
  isReconstruction?: boolean;
  isCurrent?: boolean;
  isReference?: boolean;
};

type HistoricalCountryProfile = CountryProfile & {
  passportHistory?: PassportHistoryEntry[];
};

/**
 * The reference dataset contains a verified current cover for every profile,
 * but not a scan of every historical edition. Older entries therefore use a
 * country-specific visual reconstruction until an official archive scan is
 * supplied in `passportHistory`.
 */
export function getPassportHistory(country: CountryProfile): PassportHistoryEntry[] {
  const suppliedHistory = (country as HistoricalCountryProfile).passportHistory;
  if (suppliedHistory?.length) return suppliedHistory;

  return [
    {
      year: 1982,
      title: "Machine-readable era",
      description: "The passport begins adopting the international machine-readable format.",
      titleKey: "historyMachineReadableTitle",
      descriptionKey: "historyMachineReadableDescription",
      cover: country.passportCover,
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2006,
      title: "First ePassport generation",
      description: "Biometric chips become part of the modern passport standard.",
      titleKey: "historyEpassportTitle",
      descriptionKey: "historyEpassportDescription",
      cover: country.passportCover,
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2016,
      title: "Biometric redesign",
      description: "Security printing and contactless identity features continue to evolve.",
      titleKey: "historyBiometricTitle",
      descriptionKey: "historyBiometricDescription",
      cover: country.passportCover,
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2026,
      title: "Current reference edition",
      description: `${country.name} passport cover shown in the current reference collection.`,
      titleKey: "historyCurrentTitle",
      descriptionKey: "historyCurrentDescription",
      cover: country.passportCover,
      isCurrent: true,
    },
  ];
}
