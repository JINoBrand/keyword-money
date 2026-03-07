import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/supabase/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, blog_url, nickname, note, source } = body;

    if (!email || !blog_url) {
      return NextResponse.json(
        { error: "이메일과 블로그 URL은 필수입니다." },
        { status: 400 }
      );
    }

    // 로그인 유저 확인
    let userId: string | null = null;
    let userPlan: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // 현재 plan 스냅샷
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (getAdminClient() as any)
          .from("profiles")
          .select("plan")
          .eq("user_id", user.id)
          .single();
        userPlan = profile?.plan ?? "free";
      }
    } catch {
      // 비로그인 제출도 허용
    }

    // Supabase에 저장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getAdminClient() as any)
      .from("review_program_submissions")
      .insert({
        user_id: userId,
        email,
        blog_url,
        nickname: nickname || null,
        note: note || null,
        source: source || null,
        user_plan_snapshot: userPlan,
        status: "submitted",
      });

    if (error) {
      console.error("Review submission error:", error);
      return NextResponse.json(
        { error: "제출에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    logEvent("review_program_submitted", {
      source,
      user_plan: userPlan,
      has_user: !!userId,
    }, userId ?? undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review submit error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
