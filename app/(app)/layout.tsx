import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import LanguageToggle from '@/components/layout/LanguageToggle';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-neu-base font-sans text-gray-700">
        <Sidebar userEmail={user?.email} />
        
        <main className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col">
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
