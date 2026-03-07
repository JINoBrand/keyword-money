import { getAdminClient } from "@/lib/supabase/admin";
import {
  PlanType,
  ActionType,
  PLAN_LIMITS,
  UsageCheckResult,
} from "@/types";

const ACTION_COLUMN: Record<ActionType, string> = {
  discovery: "discovery_count",
  analysis: "analysis_count",
  production: "production_count",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getAdminClient();
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const { data: sub } = await db()
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .single();

  if (sub && (sub.status === "active" || sub.status === "trialing")) {
    const { data: profile } = await db()
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    if (profile?.plan === "basic" || profile?.plan === "pro") {
      return profile.plan;
    }
  }

  return "free";
}

export async function checkAndIncrementUsage(
  userId: string,
  action: ActionType
): Promise<UsageCheckResult> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan][action];
  const column = ACTION_COLUMN[action];
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await db()
    .from("usage_daily")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const currentCount = existing ? (existing[column] as number) : 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      plan,
      used: currentCount,
      limit,
      remaining: 0,
    };
  }

  if (!existing) {
    await db().from("usage_daily").insert({
      user_id: userId,
      date: today,
      discovery_count: action === "discovery" ? 1 : 0,
      analysis_count: action === "analysis" ? 1 : 0,
      production_count: action === "production" ? 1 : 0,
    });
  } else {
    await db()
      .from("usage_daily")
      .update({ [column]: currentCount + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("date", today);
  }

  return {
    allowed: true,
    plan,
    used: currentCount + 1,
    limit,
    remaining: limit - currentCount - 1,
  };
}

export async function getUsageToday(userId: string) {
  const plan = await getUserPlan(userId);
  const today = new Date().toISOString().split("T")[0];

  const { data } = await db()
    .from("usage_daily")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  return {
    plan,
    discovery: { used: data?.discovery_count ?? 0, limit: PLAN_LIMITS[plan].discovery },
    analysis: { used: data?.analysis_count ?? 0, limit: PLAN_LIMITS[plan].analysis },
    production: { used: data?.production_count ?? 0, limit: PLAN_LIMITS[plan].production },
  };
}
