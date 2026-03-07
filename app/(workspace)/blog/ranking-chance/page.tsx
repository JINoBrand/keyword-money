"use client";

import { useState } from "react";
import { PageHeader } from "@/components/workspace/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  CheckCircle,
} from "lucide-react";
import type { RankingChanceResult } from "@/types/blog";

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const color =
    score >= 70
      ? "text-green-600"
      : score >= 45
        ? "text-amber-500"
        : "text-red-500";
  const bgColor =
    score >= 70
      ? "bg-green-500"
      : score >= 45
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/20"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`${score * 3.14} ${314 - score * 3.14}`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className={`text-sm font-semibold px-3 py-1 rounded-full ${bgColor} text-white`}
      >
        {grade}
      </span>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{score}점</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function RankingChancePage() {
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RankingChanceResult | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!keyword.trim() || !url.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/blog/ranking-chance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다");
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
        title="상위노출 가능성"
        description="내 글의 상위노출 가능성을 점수로 추정합니다"
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
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            className="h-11"
          />
          <Button
            onClick={handleCheck}
            disabled={loading || !keyword.trim() || !url.trim()}
            className="h-11 px-6 gap-2 shrink-0"
          >
            <Target className="h-4 w-4" />
            측정
          </Button>
        </div>
      </Card>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Card className="p-6 flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-5 w-24" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            상위노출 가능성을 분석 중입니다... (최대 40초 소요)
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
          {/* 종합 점수 */}
          <Card className="p-6 flex flex-col items-center">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              &ldquo;{result.keyword}&rdquo; 상위노출 가능성
            </h3>
            <ScoreGauge score={result.overallScore} grade={result.grade} />
          </Card>

          {/* 세부 점수 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">세부 항목 점수</h3>
            <div className="space-y-4">
              <ScoreBar label="키워드 커버리지" score={result.scores.keywordCoverageScore} />
              <ScoreBar label="구조 유사도" score={result.scores.structureSimilarityScore} />
              <ScoreBar label="글 길이" score={result.scores.lengthScore} />
              <ScoreBar label="섹션 구성" score={result.scores.sectionScore} />
              <ScoreBar label="이미지" score={result.scores.imageScore} />
            </div>
          </Card>

          {/* 판단 근거 */}
          {result.reasons.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                판단 근거
              </h3>
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">-</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 개선 우선순위 */}
          {result.improvements.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                개선 우선순위
              </h3>
              <ol className="space-y-2">
                {result.improvements.map((imp, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                  >
                    <span className="text-amber-500 font-semibold mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    {imp}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
