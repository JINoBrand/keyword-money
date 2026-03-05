"use client";

import Link from "next/link";
import { useState } from "react";
import { signup } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 pt-20 pb-20">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">회원가입</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            키워드머니를 시작하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">이메일</label>
              <input
                name="email"
                type="email"
                placeholder="이메일을 입력하세요"
                required
                className="w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">비밀번호</label>
              <input
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (8자 이상)"
                required
                minLength={8}
                className="w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">비밀번호 확인</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                required
                minLength={8}
                className="w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-foreground text-background py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
