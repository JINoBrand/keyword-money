import { NextRequest, NextResponse } from "next/server";

interface TrendDataPoint {
  period: string;
  ratio: number;
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, totalVolume } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
    }

    const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
    const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "네이버 검색 API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    // 2024년 1월 ~ 현재까지 (3개년 비교용)
    const endDate = new Date();
    const startDate = new Date("2024-01-01");

    const body = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      timeUnit: "month",
      keywordGroups: [
        { groupName: keyword, keywords: [keyword] },
      ],
    };

    const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("DataLab API error:", err);
      return NextResponse.json({ error: "트렌드 조회 실패" }, { status: 500 });
    }

    const data = await res.json();
    const results: TrendDataPoint[] = data.results?.[0]?.data || [];

    // 현재 진행 중인 달 제외
    const now = new Date();
    const filtered = results.filter((d: TrendDataPoint) => {
      const periodDate = new Date(d.period);
      return !(periodDate.getFullYear() === now.getFullYear() && periodDate.getMonth() === now.getMonth());
    });

    // 월(1~12) x 연도별로 정리
    const monthMap: Record<number, Record<string, number>> = {};
    const years = new Set<string>();

    for (const d of filtered) {
      const date = new Date(d.period);
      const month = date.getMonth() + 1;
      const year = String(date.getFullYear());
      years.add(year);

      if (!monthMap[month]) monthMap[month] = {};
      monthMap[month][year] = d.ratio;
    }

    // totalVolume이 있으면 상대값 → 추정 실제 검색량 변환
    // 스케일링: 가장 최근 완료 월의 ratio를 기준으로 totalVolume과 매핑
    let scaleFactor = 1;
    if (totalVolume && totalVolume > 0) {
      // 최근 완료 월의 ratio 찾기
      const sortedPeriods = filtered.sort((a: TrendDataPoint, b: TrendDataPoint) =>
        b.period.localeCompare(a.period)
      );
      const latestRatio = sortedPeriods[0]?.ratio;
      if (latestRatio && latestRatio > 0) {
        scaleFactor = totalVolume / latestRatio;
      }
    }

    const useActual = totalVolume && totalVolume > 0 && scaleFactor > 1;

    const trend = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const entry: Record<string, string | number> = { month: `${month}월` };
      for (const year of years) {
        if (monthMap[month]?.[year] !== undefined) {
          const raw = monthMap[month][year];
          entry[year] = useActual ? Math.round(raw * scaleFactor) : Math.round(raw * 10) / 10;
        }
      }
      return entry;
    });

    return NextResponse.json({
      keyword,
      trend,
      years: Array.from(years).sort(),
      isActualVolume: !!useActual,
    });
  } catch (error) {
    console.error("Trend API error:", error);
    return NextResponse.json({ error: "트렌드 조회 중 오류 발생" }, { status: 500 });
  }
}
