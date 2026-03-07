"use client";

import { Menu } from "lucide-react";
import { AuthButtons } from "@/components/AuthButtons";
import type { User } from "@supabase/supabase-js";

interface WorkspaceHeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export function WorkspaceHeader({ onMenuClick, user }: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/20 bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <AuthButtons user={user} />
    </header>
  );
}
