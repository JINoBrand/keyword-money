import { NextRequest, NextResponse } from "next/server";
import { analyzeBlogPost } from "@/lib/blog/analyzer";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "블로그 URL을 입력해주세요" },
        { status: 400 }
      );
    }

    if (!url.includes("blog.naver.com")) {
      return NextResponse.json(
        { error: "네이버 블로그 URL만 지원합니다" },
        { status: 400 }
      );
    }

    const result = await analyzeBlogPost(url.trim());
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "분석 중 오류가 발생했습니다";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
