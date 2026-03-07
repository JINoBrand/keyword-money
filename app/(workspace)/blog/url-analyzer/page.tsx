"use client";

import { useState } from "react";
import { PageHeader } from "@/components/workspace/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  FileText,
  Image,
  Hash,
  ListOrdered,
  AlertCircle,
} from "lucide-react";
import type { BlogPostAnalysis } from "@/types/blog";

export default function UrlAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlogPostAnalysis | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    const u = url.trim();
    if (!u) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/blog/url-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다");
      } else if (data.error) {
        setError(data.error);
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
        title="글 URL 분석"
        description="네이버 블로그 글의 구조와 SEO 요소를 분석합니다"
      />

      {/* 입력 */}
      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="네이버 블로그 URL을 입력하세요"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="h-11"
          />
          <Button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="h-11 px-6 gap-2 shrink-0"
          >
            <Link2 className="h-4 w-4" />
            분석
          </Button>
        </div>
      </Card>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Card className="p-6">
            <Skeleton className="h-6 w-64 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            블로그 글을 분석 중입니다...
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
          {/* 제목 */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-1">{result.title || "제목 없음"}</h3>
            <p className="text-xs text-muted-foreground truncate">{result.url}</p>
          </Card>

          {/* 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              label="글자수"
              value={`${result.textLength.toLocaleString()}자`}
            />
            <StatCard
              icon={<Image className="h-4 w-4" />}
              label="이미지"
              value={`${result.imageCount}개`}
            />
            <StatCard
              icon={<ListOrdered className="h-4 w-4" />}
              label="섹션"
              value={`${result.sectionCount}개`}
            />
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              label="문단"
              value={`${result.paragraphCount}개`}
            />
          </div>

          {/* 소제목 */}
          {result.headings.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-violet-600" />
                소제목 구조
              </h3>
              <ol className="space-y-1.5">
                {result.headings.map((h, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {h}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* 키워드 */}
          {result.topKeywords.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-green-600" />
                주요 키워드
                {result.detectedMainKeyword && (
                  <Badge className="text-xs">
                    메인: {result.detectedMainKeyword}
                  </Badge>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.topKeywords.map((kw) => (
                  <Badge key={kw.keyword} variant="outline" className="text-xs">
                    {kw.keyword}
                    <span className="ml-1 text-muted-foreground">
                      ({kw.count})
                    </span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* 글 구조 아웃라인 */}
          {result.structureOutline.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">글 구조 요약</h3>
              <ul className="space-y-1">
                {result.structureOutline.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">-</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </Card>
  );
}
