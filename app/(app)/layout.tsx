import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Supabase Auth Error:", error);
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-neu-base font-sans text-gray-700 overflow-hidden">
        {/* Left Sidebar Fixed */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <TopBar userEmail={user?.email} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-8 pb-8 pt-2">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
