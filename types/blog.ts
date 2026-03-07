/** 단일 블로그 글 분석 결과 */
export interface BlogPostAnalysis {
  url: string;
  title: string;
  textLength: number;
  imageCount: number;
  paragraphCount: number;
  sectionCount: number;
  headings: string[];
  topKeywords: { keyword: string; count: number }[];
  detectedMainKeyword?: string;
  summary?: string;
  structureOutline: string[];
  error?: string;
}

/** 상위 글 종합 분석 결과 */
export interface TopPostsAnalysis {
  keyword: string;
  posts: BlogPostAnalysis[];
  successCount: number;
  totalCount: number;
  avgTextLength: number;
  avgImageCount: number;
  avgSectionCount: number;
  avgParagraphCount: number;
  minTextLength: number;
  maxTextLength: number;
  commonHeadings: string[];
  commonSubKeywords: { keyword: string; count: number }[];
  recommendedOutline: string[];
  insights: string[];
}

/** 비교 결과 */
export interface CompareResult {
  keyword: string;
  myPost: BlogPostAnalysis;
  topAvg: {
    textLength: number;
    imageCount: number;
    sectionCount: number;
    paragraphCount: number;
  };
  comparison: {
    textLength: CompareLevel;
    imageCount: CompareLevel;
    sectionCount: CompareLevel;
    keywordCoverage: CompareLevel;
  };
  missingHeadings: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export type CompareLevel = "부족" | "유사" | "많음";

/** 상위노출 가능성 결과 */
export interface RankingChanceResult {
  keyword: string;
  overallScore: number;
  grade: "낮음" | "보통" | "높음";
  scores: {
    lengthScore: number;
    imageScore: number;
    sectionScore: number;
    keywordCoverageScore: number;
    structureSimilarityScore: number;
  };
  reasons: string[];
  improvements: string[];
}
