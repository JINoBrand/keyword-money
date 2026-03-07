import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // 비로그인 상태
  }

  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
