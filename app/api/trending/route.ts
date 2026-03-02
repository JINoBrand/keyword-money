import { NextResponse } from "next/server";

interface KeywordRank {
  rank: number;
  keyword: string;
  linkId: string;
}

interface DataLabResponse {
  statusCode: number;
  returnCode: number;
  range: string;
  ranks: KeywordRank[];
}

export async function GET() {
  try {
    // 어제 날짜 (오늘은 데이터가 아직 없을 수 있음)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    const params = new URLSearchParams({
      cid: "50000009", // 여가/생활편의
      timeUnit: "date",
      startDate: dateStr,
      endDate: dateStr,
      page: "1",
      count: "5",
      age: "",
      gender: "",
      device: "",
    });

    const res = await fetch(
      "https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Referer": "https://datalab.naver.com/shoppingInsight/sCategory.naver",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: params.toString(),
        next: { revalidate: 3600 }, // 1시간 캐시
      }
    );

    if (!res.ok) {
      return NextResponse.json({ keywords: [] });
    }

    const data: DataLabResponse = await res.json();
    const keywords = (data.ranks || []).map((r) => r.keyword);

    return NextResponse.json({ keywords, range: data.range });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json({ keywords: [] });
  }
}
