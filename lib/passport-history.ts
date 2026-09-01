import type { CountryProfile } from "@/types/passport";

export type PassportHistoryEra = "machine-readable" | "early-epassport" | "biometric" | "current";
export type PassportHistoryChangeCategory = "design" | "security" | "identity" | "standards";

export type PassportHistoryChange = {
  category: PassportHistoryChangeCategory;
  detailKey:
    | "historyMachineDesign"
    | "historyMachineSecurity"
    | "historyMachineIdentity"
    | "historyMachineStandards"
    | "historyEpassportDesign"
    | "historyEpassportSecurity"
    | "historyEpassportIdentity"
    | "historyEpassportStandards"
    | "historyBiometricDesign"
    | "historyBiometricSecurity"
    | "historyBiometricIdentity"
    | "historyBiometricStandards"
    | "historyCurrentDesign"
    | "historyCurrentSecurity"
    | "historyCurrentIdentity"
    | "historyCurrentStandards";
  detail: string;
};

export type PassportHistoryVisual = {
  layout: "classic" | "chip-centered" | "modern-offset" | "photographic";
  emblemStyle: "seal" | "crest" | "symbol" | "photographic";
  pattern: "guilloche" | "rays" | "contour" | "none";
  chip: boolean;
  variant: number;
};

export type PassportHistoryEntry = {
  year: number;
  period: string;
  era: PassportHistoryEra;
  title: string;
  description: string;
  titleKey?: "historyMachineReadableTitle" | "historyEpassportTitle" | "historyBiometricTitle" | "historyCurrentTitle";
  descriptionKey?: "historyMachineReadableDescription" | "historyEpassportDescription" | "historyBiometricDescription" | "historyCurrentDescription";
  changes: PassportHistoryChange[];
  visual: PassportHistoryVisual;
  cover?: string;
  isReconstruction?: boolean;
  isCurrent?: boolean;
  isReference?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
};

type HistoricalCountryProfile = CountryProfile & {
  passportHistory?: PassportHistoryEntry[];
};

function countryVariant(iso3: string) {
  return [...iso3].reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
}

const changesByEra: Record<PassportHistoryEra, PassportHistoryChange[]> = {
  "machine-readable": [
    { category: "design", detailKey: "historyMachineDesign", detail: "Formal state title, a prominent national seal and a traditional centered composition." },
    { category: "security", detailKey: "historyMachineSecurity", detail: "Printed guilloche patterns and laminated identity pages became common safeguards." },
    { category: "identity", detailKey: "historyMachineIdentity", detail: "Printed personal data began moving toward a two-line machine-readable zone." },
    { category: "standards", detailKey: "historyMachineStandards", detail: "This stage reflects the international adoption of ICAO machine-readable travel document standards." },
  ],
  "early-epassport": [
    { category: "design", detailKey: "historyEpassportDesign", detail: "The contactless-chip symbol appeared and the cover hierarchy was reorganized around the national emblem." },
    { category: "security", detailKey: "historyEpassportSecurity", detail: "A contactless chip and digital signatures added electronic authenticity checks." },
    { category: "identity", detailKey: "historyEpassportIdentity", detail: "Core identity fields and the facial image could be stored electronically." },
    { category: "standards", detailKey: "historyEpassportStandards", detail: "The document moved toward ICAO eMRTD and public-key verification standards." },
  ],
  biometric: [
    { category: "design", detailKey: "historyBiometricDesign", detail: "Cleaner typography, national motifs and a more restrained modern cover layout were introduced." },
    { category: "security", detailKey: "historyBiometricSecurity", detail: "Optically variable printing, laser features and stronger chip authentication continued to evolve." },
    { category: "identity", detailKey: "historyBiometricIdentity", detail: "Facial biometrics became standard while data-page materials and integration improved." },
    { category: "standards", detailKey: "historyBiometricStandards", detail: "Later ePassport generations strengthened interoperability and inspection-system security." },
  ],
  current: [
    { category: "design", detailKey: "historyCurrentDesign", detail: "The verified cover image in the current Passport Atlas reference collection is shown." },
    { category: "security", detailKey: "historyCurrentSecurity", detail: "Current security features vary by national series and are intentionally not inferred from the cover." },
    { category: "identity", detailKey: "historyCurrentIdentity", detail: "Identity-page materials and biometric fields depend on the active issuing series." },
    { category: "standards", detailKey: "historyCurrentStandards", detail: "Check the issuing authority for exact series dates, features and validity rules." },
  ],
};

/**
 * Passport Atlas has a verified current cover for every country profile, but
 * does not yet have a licensed official scan for every historical issue.
 * Earlier entries are therefore clearly-labelled, country-specific visual
 * reconstructions of global technology stages. A supplied country history can
 * replace any reconstruction with a sourced archive image without changing UI.
 */
export function getPassportHistory(country: CountryProfile): PassportHistoryEntry[] {
  const suppliedHistory = (country as HistoricalCountryProfile).passportHistory;
  if (suppliedHistory?.length) return suppliedHistory;

  const variant = countryVariant(country.iso3);

  return [
    {
      year: 1980,
      period: "1980s",
      era: "machine-readable",
      title: "Machine-readable era",
      description: "A reconstructed view of the transition from traditional booklets to international machine-readable documents.",
      titleKey: "historyMachineReadableTitle",
      descriptionKey: "historyMachineReadableDescription",
      changes: changesByEra["machine-readable"],
      visual: { layout: "classic", emblemStyle: "seal", pattern: "guilloche", chip: false, variant },
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2000,
      period: "2000s",
      era: "early-epassport",
      title: "First ePassport generation",
      description: "A reconstructed early electronic-passport cover with the new international chip mark and revised hierarchy.",
      titleKey: "historyEpassportTitle",
      descriptionKey: "historyEpassportDescription",
      changes: changesByEra["early-epassport"],
      visual: { layout: "chip-centered", emblemStyle: "crest", pattern: "rays", chip: true, variant },
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2010,
      period: "2010s",
      era: "biometric",
      title: "Biometric redesign",
      description: "A reconstructed later-generation biometric edition showing modernized typography, motifs and security cues.",
      titleKey: "historyBiometricTitle",
      descriptionKey: "historyBiometricDescription",
      changes: changesByEra.biometric,
      visual: { layout: "modern-offset", emblemStyle: "symbol", pattern: "contour", chip: true, variant },
      isReconstruction: true,
      isReference: true,
    },
    {
      year: 2026,
      period: "2026",
      era: "current",
      title: "Current reference edition",
      description: `${country.name} passport cover shown in the current reference collection.`,
      titleKey: "historyCurrentTitle",
      descriptionKey: "historyCurrentDescription",
      changes: changesByEra.current,
      visual: { layout: "photographic", emblemStyle: "photographic", pattern: "none", chip: true, variant },
      cover: country.passportCover,
      isCurrent: true,
      sourceLabel: country.passportCoverLicense,
      sourceUrl: country.passportCoverSource,
    },
  ];
}
