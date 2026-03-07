import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageToday } from "@/lib/usage";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        plan: "free" as const,
        discovery: { used: 0, limit: 10 },
        analysis: { used: 0, limit: 10 },
        production: { used: 0, limit: 0 },
      });
    }

    const usage = await getUsageToday(user.id);
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({
      plan: "free" as const,
      discovery: { used: 0, limit: 10 },
      analysis: { used: 0, limit: 10 },
      production: { used: 0, limit: 0 },
    });
  }
}
