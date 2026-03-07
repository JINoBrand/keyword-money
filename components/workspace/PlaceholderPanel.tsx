import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  inputs: string[];
  outputs: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function PlaceholderPanel({
  title,
  description,
  inputs,
  outputs,
  ctaLabel,
  ctaHref,
}: PlaceholderPanelProps) {
  return (
    <div className="rounded-2xl border border-border/30 bg-background p-8 text-center max-w-2xl mx-auto">
      <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        곧 제공 예정
      </Badge>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
        {description}
      </p>

      <div className="grid sm:grid-cols-2 gap-6 text-left max-w-lg mx-auto mb-8">
        <div className="rounded-xl bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            입력
          </p>
          <ul className="space-y-1.5">
            {inputs.map((item) => (
              <li key={item} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            출력
          </p>
          <ul className="space-y-1.5">
            {outputs.map((item) => (
              <li key={item} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-green-500 mt-0.5">←</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
