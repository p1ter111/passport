import { NextResponse } from "next/server";
import { matchGroupDestinations, validateGroupMatchRequest } from "@/lib/group-match";
import type { GroupMatchRequest } from "@/types/group-trip";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validateGroupMatchRequest(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  return NextResponse.json(matchGroupDestinations(body as GroupMatchRequest), {
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  });
}
