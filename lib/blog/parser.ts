import * as cheerio from "cheerio";

/**
 * 네이버 블로그 URL을 postView iframe URL로 변환
 * 일반 URL, 모바일 URL 등 다양한 형식 대응
 */
export function normalizeBlogUrl(url: string): {
  iframeUrl: string | null;
  originalUrl: string;
} {
  const trimmed = url.trim();

  // blog.naver.com/{blogId}/{logNo} → iframe URL
  const pcMatch = trimmed.match(
    /blog\.naver\.com\/([^/?#]+)\/(\d+)/
  );
  if (pcMatch) {
    return {
      iframeUrl: `https://blog.naver.com/PostView.naver?blogId=${pcMatch[1]}&logNo=${pcMatch[2]}`,
      originalUrl: trimmed,
    };
  }

  // m.blog.naver.com/{blogId}/{logNo}
  const mobileMatch = trimmed.match(
    /m\.blog\.naver\.com\/([^/?#]+)\/(\d+)/
  );
  if (mobileMatch) {
    return {
      iframeUrl: `https://blog.naver.com/PostView.naver?blogId=${mobileMatch[1]}&logNo=${mobileMatch[2]}`,
      originalUrl: trimmed,
    };
  }

  // PostView.naver 형태는 그대로
  if (trimmed.includes("PostView.naver") || trimmed.includes("PostView.nhn")) {
    return { iframeUrl: trimmed, originalUrl: trimmed };
  }

  // 그 외 URL은 그대로 fetch 시도
  return { iframeUrl: trimmed, originalUrl: trimmed };
}

/**
 * 블로그 HTML을 fetch하고 본문 추출
 */
export async function fetchBlogHtml(url: string): Promise<{
  html: string;
  title: string;
  error?: string;
}> {
  try {
    const { iframeUrl } = normalizeBlogUrl(url);
    if (!iframeUrl) {
      return { html: "", title: "", error: "유효하지 않은 URL입니다" };
    }

    const res = await fetch(iframeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { html: "", title: "", error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 제목 추출
    const title =
      $(".se-title-text").text().trim() ||
      $(".pcol1 .itemSubjectBoldfont").text().trim() ||
      $("title").text().trim() ||
      "";

    return { html, title };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch 실패";
    return { html: "", title: "", error: msg };
  }
}

/**
 * HTML에서 본문 텍스트, 이미지, 구조 추출
 */
export function extractBlogContent(html: string): {
  text: string;
  imageCount: number;
  headings: string[];
  paragraphs: string[];
  sections: string[];
} {
  const $ = cheerio.load(html);

  // 스마트에디터 3 (se-main-container)
  let container = $(".se-main-container");
  if (container.length === 0) {
    // 구에디터
    container = $("#postViewArea, .post-view, #post-view, .se_component_wrap");
  }
  if (container.length === 0) {
    container = $("body");
  }

  // 이미지 수
  const imageCount = container.find("img").length;

  // 소제목/헤딩 추출
  const headings: string[] = [];

  // SE3 소제목
  container.find(".se-section-oglink").remove(); // 링크 섹션 제거
  container.find(".se-text-paragraph.se-text-paragraph-align-").each((_, el) => {
    // skip
  });

  // 일반 헤딩 태그
  container.find("h2, h3, h4, strong.se-text-paragraph").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 60) {
      headings.push(text);
    }
  });

  // SE3 소제목 (볼드 텍스트 중 짧은 것)
  container.find(".se-module-text b, .se-module-text strong").each((_, el) => {
    const text = $(el).text().trim();
    const parent = $(el).parent().text().trim();
    // 부모 텍스트가 이 볼드 텍스트와 거의 같으면 → 소제목
    if (
      text.length > 2 &&
      text.length < 60 &&
      parent.length < text.length * 2 &&
      !headings.includes(text)
    ) {
      headings.push(text);
    }
  });

  // 텍스트 추출
  container.find("script, style, .se-oglink-info, .se-section-oglink").remove();
  const text = container.text().replace(/\s+/g, " ").trim();

  // 문단 추출
  const paragraphs: string[] = [];
  container
    .find(
      "p, .se-text-paragraph, div.se_textarea, div.__se_module_data"
    )
    .each((_, el) => {
      const pText = $(el).text().trim();
      if (pText.length > 10) {
        paragraphs.push(pText);
      }
    });

  // 섹션 (SE3 모듈 기반)
  const sections: string[] = [];
  container.find(".se-section").each((_, el) => {
    const sText = $(el).text().trim();
    if (sText.length > 20) {
      const preview = sText.slice(0, 80);
      sections.push(preview);
    }
  });

  return { text, imageCount, headings, paragraphs, sections };
}

/** 한국어 불용어 */
const STOP_WORDS = new Set([
  "이", "그", "저", "것", "수", "등", "더", "또", "및",
  "가", "에", "를", "은", "는", "이", "의", "로", "에서",
  "합니다", "있습니다", "입니다", "했습니다", "됩니다",
  "하는", "있는", "것을", "위해", "대한", "통해",
  "정말", "너무", "진짜", "되게", "아주", "매우",
  "하고", "있고", "해서", "에요", "구요", "네요",
  "좋은", "좋아", "많은", "많이", "때문", "같은",
  "그래서", "그리고", "하지만", "그런데", "근데",
  "the", "is", "a", "an", "and", "or", "in", "on",
]);

/**
 * 텍스트에서 키워드 빈도 추출
 */
export function extractKeywords(
  text: string,
  topN: number = 15
): { keyword: string; count: number }[] {
  const cleaned = text
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter((t) => t.length >= 2);

  const freq: Record<string, number> = {};
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;
    if (lower.length < 2) continue;
    freq[lower] = (freq[lower] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword, count]) => ({ keyword, count }));
}
