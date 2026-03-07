import type {
  BlogPostAnalysis,
  TopPostsAnalysis,
  CompareResult,
  CompareLevel,
  RankingChanceResult,
} from "@/types/blog";
import { fetchBlogHtml, extractBlogContent, extractKeywords } from "./parser";

/**
 * 단일 블로그 글 분석
 */
export async function analyzeBlogPost(
  url: string
): Promise<BlogPostAnalysis> {
  const { html, title, error } = await fetchBlogHtml(url);

  if (error || !html) {
    return {
      url,
      title: title || "",
      textLength: 0,
      imageCount: 0,
      paragraphCount: 0,
      sectionCount: 0,
      headings: [],
      topKeywords: [],
      structureOutline: [],
      error: error || "본문을 가져올 수 없습니다",
    };
  }

  const { text, imageCount, headings, paragraphs, sections } =
    extractBlogContent(html);
  const topKeywords = extractKeywords(text);

  // 추정 메인 키워드 (가장 빈도 높은 2글자 이상 키워드)
  const detectedMainKeyword = topKeywords[0]?.keyword;

  // 구조 아웃라인
  const structureOutline =
    headings.length > 0
      ? headings
      : paragraphs.slice(0, 8).map((p) => p.slice(0, 40) + "...");

  return {
    url,
    title,
    textLength: text.length,
    imageCount,
    paragraphCount: paragraphs.length || Math.max(1, Math.floor(text.length / 200)),
    sectionCount: sections.length || headings.length || 1,
    headings,
    topKeywords,
    detectedMainKeyword,
    structureOutline,
  };
}

/**
 * 키워드 기준 상위 블로그 URL 가져오기 (네이버 검색 API)
 */
export async function fetchTopBlogUrls(
  keyword: string,
  count: number = 5
): Promise<string[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("네이버 검색 API 키가 설정되지 않았습니다");
  }

  const res = await fetch(
    `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(
      keyword
    )}&display=${count}&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`네이버 검색 API 오류: ${res.status}`);
  }

  const data = await res.json();
  const urls: string[] = [];

  for (const item of data.items || []) {
    const link = item.link || item.bloggerlink;
    if (link && link.includes("blog.naver.com")) {
      urls.push(link);
    }
  }

  return urls.slice(0, count);
}

/**
 * 상위 글 종합 분석
 */
export async function analyzeTopPosts(
  keyword: string
): Promise<TopPostsAnalysis> {
  const urls = await fetchTopBlogUrls(keyword, 5);

  const results = await Promise.allSettled(
    urls.map((url) => analyzeBlogPost(url))
  );

  const posts: BlogPostAnalysis[] = results
    .filter(
      (r): r is PromiseFulfilledResult<BlogPostAnalysis> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  const successPosts = posts.filter((p) => !p.error);
  const successCount = successPosts.length;

  if (successCount === 0) {
    return {
      keyword,
      posts,
      successCount: 0,
      totalCount: urls.length,
      avgTextLength: 0,
      avgImageCount: 0,
      avgSectionCount: 0,
      avgParagraphCount: 0,
      minTextLength: 0,
      maxTextLength: 0,
      commonHeadings: [],
      commonSubKeywords: [],
      recommendedOutline: [],
      insights: ["상위 글 분석에 실패했습니다. 잠시 후 다시 시도해주세요."],
    };
  }

  // 통계 계산
  const avgTextLength = Math.round(
    successPosts.reduce((s, p) => s + p.textLength, 0) / successCount
  );
  const avgImageCount = Math.round(
    successPosts.reduce((s, p) => s + p.imageCount, 0) / successCount
  );
  const avgSectionCount = Math.round(
    successPosts.reduce((s, p) => s + p.sectionCount, 0) / successCount
  );
  const avgParagraphCount = Math.round(
    successPosts.reduce((s, p) => s + p.paragraphCount, 0) / successCount
  );
  const textLengths = successPosts.map((p) => p.textLength);
  const minTextLength = Math.min(...textLengths);
  const maxTextLength = Math.max(...textLengths);

  // 공통 헤딩 (2개 이상 글에서 등장)
  const headingFreq: Record<string, number> = {};
  for (const p of successPosts) {
    const seen = new Set<string>();
    for (const h of p.headings) {
      const normalized = normalizeHeading(h);
      if (!seen.has(normalized)) {
        headingFreq[normalized] = (headingFreq[normalized] || 0) + 1;
        seen.add(normalized);
      }
    }
  }
  const commonHeadings = Object.entries(headingFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([h]) => h);

  // 공통 서브 키워드
  const kwFreq: Record<string, number> = {};
  for (const p of successPosts) {
    const seen = new Set<string>();
    for (const kw of p.topKeywords.slice(0, 10)) {
      if (!seen.has(kw.keyword)) {
        kwFreq[kw.keyword] = (kwFreq[kw.keyword] || 0) + 1;
        seen.add(kw.keyword);
      }
    }
  }
  const commonSubKeywords = Object.entries(kwFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }));

  // 추천 아웃라인 (빈도 기반 소제목)
  const outlineFreq: Record<string, number> = {};
  for (const p of successPosts) {
    for (const h of p.headings) {
      const core = extractCore(h);
      if (core) {
        outlineFreq[core] = (outlineFreq[core] || 0) + 1;
      }
    }
  }
  const recommendedOutline = Object.entries(outlineFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([h]) => `${keyword} ${h}`);

  // 인사이트 생성
  const insights = generateInsights(
    avgTextLength,
    avgImageCount,
    avgSectionCount,
    minTextLength,
    maxTextLength,
    commonHeadings,
    commonSubKeywords.map((k) => k.keyword)
  );

  return {
    keyword,
    posts,
    successCount,
    totalCount: urls.length,
    avgTextLength,
    avgImageCount,
    avgSectionCount,
    avgParagraphCount,
    minTextLength,
    maxTextLength,
    commonHeadings,
    commonSubKeywords,
    recommendedOutline:
      recommendedOutline.length > 0
        ? recommendedOutline
        : commonHeadings.slice(0, 6).map((h) => `${keyword} ${h}`),
    insights,
  };
}

/**
 * 내 글 vs 상위 글 비교
 */
export async function compareToTopPosts(
  keyword: string,
  myUrl: string
): Promise<CompareResult> {
  const [topAnalysis, myPost] = await Promise.all([
    analyzeTopPosts(keyword),
    analyzeBlogPost(myUrl),
  ]);

  const topAvg = {
    textLength: topAnalysis.avgTextLength,
    imageCount: topAnalysis.avgImageCount,
    sectionCount: topAnalysis.avgSectionCount,
    paragraphCount: topAnalysis.avgParagraphCount,
  };

  const comparison = {
    textLength: compareLevel(myPost.textLength, topAvg.textLength, 0.3),
    imageCount: compareLevel(myPost.imageCount, topAvg.imageCount, 0.4),
    sectionCount: compareLevel(myPost.sectionCount, topAvg.sectionCount, 0.4),
    keywordCoverage: keywordCoverageLevel(
      myPost.topKeywords.map((k) => k.keyword),
      topAnalysis.commonSubKeywords.map((k) => k.keyword)
    ),
  };

  // 빠진 소제목
  const myHeadingsLower = new Set(
    myPost.headings.map((h) => normalizeHeading(h))
  );
  const missingHeadings = topAnalysis.commonHeadings.filter(
    (h) => !myHeadingsLower.has(normalizeHeading(h))
  );

  // 빠진 키워드
  const myKwSet = new Set(myPost.topKeywords.map((k) => k.keyword));
  const missingKeywords = topAnalysis.commonSubKeywords
    .map((k) => k.keyword)
    .filter((k) => !myKwSet.has(k))
    .slice(0, 10);

  // 개선 제안
  const suggestions = generateSuggestions(
    comparison,
    missingHeadings,
    missingKeywords,
    topAvg,
    myPost
  );

  return {
    keyword,
    myPost,
    topAvg,
    comparison,
    missingHeadings,
    missingKeywords,
    suggestions,
  };
}

/**
 * 상위노출 가능성 점수 계산
 */
export async function calculateRankingChance(
  keyword: string,
  myUrl: string
): Promise<RankingChanceResult> {
  const compareResult = await compareToTopPosts(keyword, myUrl);
  const { myPost, topAvg, comparison, missingHeadings, missingKeywords } =
    compareResult;

  // 각 항목 점수 (0~100)
  const lengthScore = ratioScore(myPost.textLength, topAvg.textLength);
  const imageScore = ratioScore(myPost.imageCount, topAvg.imageCount);
  const sectionScore = ratioScore(myPost.sectionCount, topAvg.sectionCount);

  // 키워드 커버리지
  const totalCommonKw = missingKeywords.length + myPost.topKeywords.length;
  const coveredKw = totalCommonKw > 0 ? myPost.topKeywords.length : 0;
  const keywordCoverageScore =
    totalCommonKw > 0
      ? Math.min(100, Math.round((coveredKw / Math.max(totalCommonKw, 1)) * 100))
      : 50;

  // 구조 유사도
  const totalCommonH = missingHeadings.length + myPost.headings.length;
  const matchedH = totalCommonH > 0 ? myPost.headings.length : 0;
  const structureSimilarityScore =
    totalCommonH > 0
      ? Math.min(100, Math.round((matchedH / Math.max(totalCommonH, 1)) * 100))
      : 50;

  // 종합 점수
  const overallScore = Math.round(
    lengthScore * 0.2 +
      imageScore * 0.15 +
      sectionScore * 0.2 +
      keywordCoverageScore * 0.25 +
      structureSimilarityScore * 0.2
  );

  const grade: RankingChanceResult["grade"] =
    overallScore >= 70 ? "높음" : overallScore >= 45 ? "보통" : "낮음";

  // 이유
  const reasons: string[] = [];
  if (comparison.textLength === "유사" || comparison.textLength === "많음") {
    reasons.push("글 길이가 상위 글 평균과 유사하거나 충분합니다");
  } else {
    reasons.push("글 길이가 상위 글 평균 대비 부족합니다");
  }
  if (comparison.imageCount === "유사" || comparison.imageCount === "많음") {
    reasons.push("이미지 수가 적정 수준입니다");
  } else {
    reasons.push("이미지 수가 상위 글 대비 부족합니다");
  }
  if (comparison.keywordCoverage === "유사" || comparison.keywordCoverage === "많음") {
    reasons.push("주요 서브 키워드를 잘 포함하고 있습니다");
  } else {
    reasons.push("상위 글에서 자주 등장하는 서브 키워드가 부족합니다");
  }

  // 개선 우선순위
  const improvements: string[] = [];
  const scoreItems = [
    { name: "키워드 커버리지", score: keywordCoverageScore, fix: missingKeywords.length > 0 ? `"${missingKeywords.slice(0, 3).join('", "')}" 등의 키워드를 추가하세요` : "서브 키워드를 더 활용하세요" },
    { name: "구조 유사도", score: structureSimilarityScore, fix: missingHeadings.length > 0 ? `"${missingHeadings.slice(0, 2).join('", "')}" 소제목을 추가해보세요` : "소제목을 더 추가하세요" },
    { name: "글 길이", score: lengthScore, fix: `글자수를 ${topAvg.textLength.toLocaleString()}자 수준으로 보강하세요` },
    { name: "이미지", score: imageScore, fix: `이미지를 ${topAvg.imageCount}개 수준으로 보강하세요` },
    { name: "섹션 구성", score: sectionScore, fix: "글의 섹션/소제목을 더 세분화하세요" },
  ];
  scoreItems
    .sort((a, b) => a.score - b.score)
    .filter((item) => item.score < 70)
    .slice(0, 4)
    .forEach((item) => improvements.push(item.fix));

  return {
    keyword,
    overallScore,
    grade,
    scores: {
      lengthScore,
      imageScore,
      sectionScore,
      keywordCoverageScore,
      structureSimilarityScore,
    },
    reasons,
    improvements,
  };
}

// --- 유틸 함수 ---

function normalizeHeading(h: string): string {
  return h
    .replace(/[0-9.)\-\s]+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase();
}

function extractCore(heading: string): string | null {
  const cleaned = heading
    .replace(/[0-9.)\-:]+/g, "")
    .replace(/^\s+|\s+$/g, "");
  if (cleaned.length < 2 || cleaned.length > 30) return null;
  return cleaned;
}

function compareLevel(
  myValue: number,
  avgValue: number,
  tolerance: number
): CompareLevel {
  if (avgValue === 0) return "유사";
  const ratio = myValue / avgValue;
  if (ratio < 1 - tolerance) return "부족";
  if (ratio > 1 + tolerance) return "많음";
  return "유사";
}

function keywordCoverageLevel(
  myKeywords: string[],
  commonKeywords: string[]
): CompareLevel {
  if (commonKeywords.length === 0) return "유사";
  const mySet = new Set(myKeywords);
  const covered = commonKeywords.filter((k) => mySet.has(k)).length;
  const ratio = covered / commonKeywords.length;
  if (ratio < 0.3) return "부족";
  if (ratio > 0.6) return "많음";
  return "유사";
}

function ratioScore(myValue: number, avgValue: number): number {
  if (avgValue === 0) return 50;
  const ratio = myValue / avgValue;
  if (ratio >= 0.8 && ratio <= 1.3) return 85 + Math.round((1 - Math.abs(1 - ratio)) * 15);
  if (ratio >= 0.5 && ratio < 0.8) return 40 + Math.round(ratio * 40);
  if (ratio > 1.3 && ratio <= 2) return 70;
  if (ratio < 0.5) return Math.round(ratio * 60);
  return 60; // ratio > 2
}

function generateInsights(
  avgTextLength: number,
  avgImageCount: number,
  avgSectionCount: number,
  minTextLength: number,
  maxTextLength: number,
  commonHeadings: string[],
  commonKeywords: string[]
): string[] {
  const insights: string[] = [];

  insights.push(
    `상위 글들은 대체로 ${minTextLength.toLocaleString()}~${maxTextLength.toLocaleString()}자 수준입니다`
  );
  insights.push(
    `이미지가 평균 ${avgImageCount}개 사용됩니다`
  );
  if (avgSectionCount > 1) {
    insights.push(
      `글이 평균 ${avgSectionCount}개의 섹션으로 구성되어 있습니다`
    );
  }
  if (commonHeadings.length > 0) {
    insights.push(
      `"${commonHeadings.slice(0, 4).join(" / ")}" 구조가 자주 등장합니다`
    );
  }
  if (commonKeywords.length > 0) {
    insights.push(
      `"${commonKeywords.slice(0, 5).join(", ")}" 키워드가 공통적으로 사용됩니다`
    );
  }

  return insights;
}

function generateSuggestions(
  comparison: CompareResult["comparison"],
  missingHeadings: string[],
  missingKeywords: string[],
  topAvg: CompareResult["topAvg"],
  myPost: BlogPostAnalysis
): string[] {
  const suggestions: string[] = [];

  if (comparison.textLength === "부족") {
    const diff = topAvg.textLength - myPost.textLength;
    suggestions.push(
      `글자수를 약 ${diff.toLocaleString()}자 정도 보강해보세요 (현재 ${myPost.textLength.toLocaleString()}자 → 목표 ${topAvg.textLength.toLocaleString()}자)`
    );
  }
  if (comparison.imageCount === "부족") {
    suggestions.push(
      `이미지를 ${topAvg.imageCount - myPost.imageCount}장 정도 추가해보세요`
    );
  }
  if (comparison.sectionCount === "부족") {
    suggestions.push("소제목과 섹션을 더 세분화해서 구성해보세요");
  }
  if (missingHeadings.length > 0) {
    suggestions.push(
      `다음 소제목을 추가해보세요: "${missingHeadings.slice(0, 3).join('", "')}"`
    );
  }
  if (missingKeywords.length > 0) {
    suggestions.push(
      `다음 키워드를 본문에 포함해보세요: "${missingKeywords.slice(0, 5).join('", "')}"`
    );
  }
  if (comparison.keywordCoverage === "부족") {
    suggestions.push("제목과 서두에 메인 키워드 노출을 강화하세요");
  }

  return suggestions;
}
