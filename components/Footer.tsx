import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/30 bg-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* 서비스 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Service
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>키워드 분석</li>
              <li>블로그 글 변환</li>
              <li>태그 & CSV</li>
            </ul>
          </div>

          {/* 법적 고지 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>제휴 문의</li>
              <li>
                <a
                  href="mailto:contact@ifandtry.com"
                  className="hover:text-primary transition-colors"
                >
                  contact@ifandtry.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 opacity-30" />

        <div className="text-center text-xs text-muted-foreground/60 space-y-1">
          <p>If and Try | 대표: 이진호</p>
          <p>Copyright 2026. If and Try. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
