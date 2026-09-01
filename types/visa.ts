export type VisaStatus =
  | "visa free"
  | "visa on arrival"
  | "eta"
  | "e-visa"
  | "visa required"
  | "no admission"
  | "-1"
  | "unknown";

export type VisaRule = {
  status: VisaStatus;
  days?: number | string | null;
};

export type VisaRules = Record<string, VisaRule>;
