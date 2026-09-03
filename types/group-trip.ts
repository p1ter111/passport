import type { Region } from "./passport";
import type { VisaStatus } from "./visa";

export type VisaTolerance = "visa-free" | "arrival" | "evisa";
export type GroupMemberRole = "owner" | "member";
export type DestinationVoteValue = -1 | 1;

export type GroupPreferences = {
  travelMonth: string;
  tripDays: number;
  regions: Region[];
  visaTolerance: VisaTolerance;
  includeVisaRequired: boolean;
};

export type GroupMatchMemberInput = {
  id: string;
  name: string;
  passportIso3: string;
};

export type GroupMatchRequest = {
  members: GroupMatchMemberInput[];
  preferences: GroupPreferences;
};

export type GroupMemberVisaResult = {
  memberId: string;
  memberName: string;
  passportIso3: string;
  status: VisaStatus;
  days: number | string | null;
  score: number;
  stayFits: boolean | null;
};

export type GroupDestinationMatch = {
  destinationIso3: string;
  destinationIso2: string;
  groupScore: number;
  commonStayDays: number | null;
  stayDataComplete: boolean;
  worstStatus: VisaStatus;
  requiresTraditionalVisa: boolean;
  members: GroupMemberVisaResult[];
};

export type GroupMatchResponse = {
  matches: GroupDestinationMatch[];
  totalEvaluated: number;
  hiddenCount: number;
  dataSnapshot: string;
  dataSourceName: string;
  dataSourceUrl: string;
  recommendedRefreshDays: number;
  staleAfterDays: number;
};

export type TravelGroup = {
  id: string;
  ownerId: string;
  name: string;
  preferences: GroupPreferences;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  passportIso3: string;
  role: GroupMemberRole;
  createdAt: string;
};

export type DestinationVote = {
  groupId: string;
  destinationIso3: string;
  userId: string;
  value: DestinationVoteValue;
  createdAt: string;
};
