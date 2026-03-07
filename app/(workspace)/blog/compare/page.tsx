"use client";

import { useState } from "react";
import { PageHeader } from "@/components/workspace/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitCompareArrows,
  AlertCircle,
  Lightbulb,
  Hash,
  ListOrdered,
} from "lucide-react";
import type { CompareResult, CompareLevel } from "@/types/blog";

function LevelBadge({ level }: { level: CompareLevel }) {
  const map: Record<CompareLevel, { className: string }> = {
    "부족": { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    "유사": { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    "많음": { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${map[level].className}`}>
      {level}
    </span>
  );
}

export default function ComparePage() {
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!keyword.trim() || !url.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/blog/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "비교 분석에 실패했습니다");
      } else {
        setResult(data);
      }
    } catch {
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="내 글 비교"
        description="내 글과 상위 노출 글을 비교해 부족한 포인트를 찾습니다"
      />

      {/* 입력 */}
      <Card className="p-4 mb-6 space-y-3">
        <Input
          placeholder="타겟 키워드 (예: 다이어트 식단)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-11"
        />
        <div className="flex gap-2">
          <Input
            placeholder="내 블로그 글 URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            className="h-11"
          />
          <Button
            onClick={handleCompare}
            disabled={loading || !keyword.trim() || !url.trim()}
            className="h-11 px-6 gap-2 shrink-0"
          >
            <GitCompareArrows className="h-4 w-4" />
            비교
          </Button>
        </div>
      </Card>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Card className="p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-32 rounded-xl" />
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            상위 글과 비교 분석 중입니다... (최대 40초 소요)
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <Card className="p-6 border-destructive/30">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      {/* 결과 */}
      {result && (
        <div className="space-y-4">
          {/* 비교표 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4 text-primary" />
              항목별 비교
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">항목</th>
                    <th className="text-right py-2 px-4 font-medium">내 글</th>
                    <th className="text-right py-2 px-4 font-medium">상위 평균</th>
                    <th className="text-center py-2 pl-4 font-medium">판정</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="py-2.5 pr-4">글자수</td>
                    <td className="text-right py-2.5 px-4 font-mono">
                      {result.myPost.textLength.toLocaleString()}자
                    </td>
                    <td className="text-right py-2.5 px-4 font-mono text-muted-foreground">
                      {result.topAvg.textLength.toLocaleString()}자
                    </td>
                    <td className="text-center py-2.5 pl-4">
                      <LevelBadge level={result.comparison.textLength} />
                    </td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2.5 pr-4">이미지 수</td>
                    <td className="text-right py-2.5 px-4 font-mono">
                      {result.myPost.imageCount}개
                    </td>
                    <td className="text-right py-2.5 px-4 font-mono text-muted-foreground">
                      {result.topAvg.imageCount}개
                    </td>
                    <td className="text-center py-2.5 pl-4">
                      <LevelBadge level={result.comparison.imageCount} />
                    </td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2.5 pr-4">섹션 수</td>
                    <td className="text-right py-2.5 px-4 font-mono">
                      {result.myPost.sectionCount}개
                    </td>
                    <td className="text-right py-2.5 px-4 font-mono text-muted-foreground">
                      {result.topAvg.sectionCount}개
                    </td>
                    <td className="text-center py-2.5 pl-4">
                      <LevelBadge level={result.comparison.sectionCount} />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4">키워드 커버리지</td>
                    <td className="text-right py-2.5 px-4" colSpan={2} />
                    <td className="text-center py-2.5 pl-4">
                      <LevelBadge level={result.comparison.keywordCoverage} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* 개선 제안 */}
          {result.suggestions.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                개선 제안
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-0.5 shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 빠진 소제목 */}
          {result.missingHeadings.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-violet-600" />
                추가 추천 소제목
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingHeadings.map((h) => (
                  <Badge key={h} variant="outline" className="text-xs">
                    {h}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* 빠진 키워드 */}
          {result.missingKeywords.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-green-600" />
                부족한 키워드
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw) => (
                  <Badge key={kw} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
