"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/workspace/PageHeader";
import { Check, Loader2 } from "lucide-react";

export default function ReviewSubmitPage() {
  const [email, setEmail] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !blogUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/review-program/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          blog_url: blogUrl.trim(),
          nickname: nickname.trim() || undefined,
          note: note.trim() || undefined,
          source: "workspace",
        }),
      });
      if (res.ok) setDone(true);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">제출 완료!</h2>
        <p className="text-sm text-muted-foreground">
          검토 후 1~2일 내에 이메일로 안내드리겠습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader
        title="후기 인증 제출"
        description="블로그 후기 URL과 이메일을 입력해주세요"
      />

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">이메일 *</label>
          <Input
            type="email"
            placeholder="이용권을 받을 이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">블로그 후기 URL *</label>
          <Input
            placeholder="https://blog.naver.com/..."
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">닉네임 (선택)</label>
          <Input
            placeholder="블로그 닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">메모 (선택)</label>
          <Textarea
            placeholder="전하고 싶은 말이 있다면"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !blogUrl.trim()}
          className="w-full h-12 rounded-xl gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 제출 중...</>
          ) : (
            "제출하기"
          )}
        </Button>
      </div>
    </div>
  );
}
