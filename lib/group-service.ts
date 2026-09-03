import type { SupabaseClient } from "@supabase/supabase-js";
import type { DestinationVote, GroupMember, GroupPreferences, TravelGroup } from "@/types/group-trip";

type GroupRow = {
  id: string;
  owner_id: string;
  name: string;
  preferences: GroupPreferences;
  share_token: string;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string;
  passport_iso3: string;
  role: "owner" | "member";
  created_at: string;
};

type VoteRow = {
  group_id: string;
  destination_iso3: string;
  user_id: string;
  value: -1 | 1;
  created_at: string;
};

export function mapGroup(row: GroupRow): TravelGroup {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    preferences: row.preferences,
    shareToken: row.share_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMember(row: MemberRow): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    displayName: row.display_name,
    passportIso3: row.passport_iso3,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapVote(row: VoteRow): DestinationVote {
  return {
    groupId: row.group_id,
    destinationIso3: row.destination_iso3,
    userId: row.user_id,
    value: row.value,
    createdAt: row.created_at,
  };
}

export async function loadTravelGroup(client: SupabaseClient, groupId: string) {
  const [groupResult, memberResult, voteResult, inviteResult] = await Promise.all([
    client.from("travel_groups").select("*").eq("id", groupId).single(),
    client.from("group_members").select("*").eq("group_id", groupId).order("created_at"),
    client.from("destination_votes").select("*").eq("group_id", groupId),
    client.from("group_invites").select("*").eq("group_id", groupId).is("used_at", null).is("revoked_at", null),
  ]);
  if (groupResult.error) throw groupResult.error;
  if (memberResult.error) throw memberResult.error;
  if (voteResult.error) throw voteResult.error;
  return {
    group: mapGroup(groupResult.data as GroupRow),
    members: (memberResult.data as MemberRow[]).map(mapMember),
    votes: (voteResult.data as VoteRow[]).map(mapVote),
    invites: inviteResult.error ? [] : inviteResult.data as Array<{ id: string; member_id: string; expires_at: string }>,
  };
}

export async function createTravelGroup(
  client: SupabaseClient,
  ownerId: string,
  input: { name: string; preferences: GroupPreferences; members: Array<{ displayName: string; passportIso3: string }> },
) {
  const groupResult = await client.from("travel_groups").insert({
    owner_id: ownerId,
    name: input.name.trim(),
    preferences: input.preferences,
  }).select("*").single();
  if (groupResult.error) throw groupResult.error;
  const group = mapGroup(groupResult.data as GroupRow);
  const memberResult = await client.from("group_members").insert(input.members.map((member, index) => ({
    group_id: group.id,
    user_id: index === 0 ? ownerId : null,
    display_name: member.displayName.trim(),
    passport_iso3: member.passportIso3,
    role: index === 0 ? "owner" : "member",
  })));
  if (memberResult.error) {
    await client.from("travel_groups").delete().eq("id", group.id);
    throw memberResult.error;
  }
  return group;
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

