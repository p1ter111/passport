import { describe, expect, it } from "vitest";
import { matchGroupDestinations, validateGroupMatchRequest, visaStatusWeights } from "./group-match";
import type { GroupMatchRequest } from "@/types/group-trip";

function request(overrides: Partial<GroupMatchRequest> = {}): GroupMatchRequest {
  return {
    members: [
      { id: "member-cn", name: "Lin", passportIso3: "CHN" },
      { id: "member-jp", name: "Aoi", passportIso3: "JPN" },
      { id: "member-tr", name: "Deniz", passportIso3: "TUR" },
    ],
    preferences: {
      travelMonth: "2026-10",
      tripDays: 7,
      regions: [],
      visaTolerance: "evisa",
      includeVisaRequired: false,
    },
    ...overrides,
  };
}

describe("group passport matching", () => {
  it("uses the agreed visa status weights", () => {
    expect(visaStatusWeights).toEqual({
      "-1": 100,
      "visa free": 100,
      eta: 90,
      "visa on arrival": 80,
      "e-visa": 65,
      "visa required": 20,
      unknown: 10,
      "no admission": 0,
    });
  });

  it("returns only destinations acceptable to every member in strict mode", () => {
    const result = matchGroupDestinations(request());
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.every((match) => match.members.length === 3)).toBe(true);
    expect(result.matches.every((match) => match.members.every((rule) => !["visa required", "no admission", "unknown"].includes(rule.status)))).toBe(true);
    expect(result.matches.every((match) => match.groupScore >= 0 && match.groupScore <= 100)).toBe(true);
    expect(result.dataSourceName).toBe("imorte/passport-index-data");
    expect(result.recommendedRefreshDays).toBe(3);
    expect(result.staleAfterDays).toBe(7);
  });

  it("keeps duplicate passports as separate travelers", () => {
    const result = matchGroupDestinations(request({
      members: [
        { id: "one", name: "One", passportIso3: "CHN" },
        { id: "two", name: "Two", passportIso3: "CHN" },
      ],
    }));
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.every((match) => match.members.map((member) => member.memberId).join(",") === "one,two")).toBe(true);
  });

  it("filters destinations when a known stay limit is shorter than the trip", () => {
    const shortTrip = matchGroupDestinations(request({
      members: [
        { id: "one", name: "One", passportIso3: "CHN" },
        { id: "two", name: "Two", passportIso3: "CHN" },
      ],
    }));
    const longTrip = matchGroupDestinations(request({
      members: [
        { id: "one", name: "One", passportIso3: "CHN" },
        { id: "two", name: "Two", passportIso3: "CHN" },
      ],
      preferences: { ...request().preferences, tripDays: 365 },
    }));
    expect(longTrip.matches.length).toBeLessThan(shortTrip.matches.length);
  });

  it("can include traditional visa destinations without including no-admission or unknown data", () => {
    const strict = matchGroupDestinations(request());
    const expanded = matchGroupDestinations(request({
      preferences: { ...request().preferences, includeVisaRequired: true },
    }));
    expect(expanded.matches.length).toBeGreaterThan(strict.matches.length);
    expect(expanded.matches.some((match) => match.requiresTraditionalVisa)).toBe(true);
    expect(expanded.matches.every((match) => match.members.every((rule) => !["no admission", "unknown"].includes(rule.status)))).toBe(true);
  });

  it("validates member counts and passport identifiers", () => {
    expect(validateGroupMatchRequest(request())).toBeNull();
    expect(validateGroupMatchRequest(request({ members: [request().members[0]] }))).toContain("2 to 10");
    expect(validateGroupMatchRequest(request({
      members: [request().members[0], { id: "bad", name: "Bad", passportIso3: "ZZZ" }],
    }))).toContain("valid passport");
  });
});
