import Link from 'next/link';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher';
import { logout } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
          <div>
            <div className="h-16 flex items-center px-6 border-b border-gray-200 font-bold text-lg">
              Creative OS
            </div>
            <WorkspaceSwitcher />
            <nav className="p-4 space-y-1">
              <Link href="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/boards" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Boards
              </Link>
              <Link href="/campaigns" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Campaigns
              </Link>
              <Link href="/creative-briefs" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Creative Briefs
              </Link>
              <Link href="/video-ads" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Video Ads
              </Link>
              <Link href="/media-library" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Media Library
              </Link>
              <Link href="/analytics" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 mt-4 border-t border-gray-100 pt-4">
                Analytics
              </Link>
              <Link href="/leaderboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Leaderboard
              </Link>
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium px-3 uppercase">Account</p>
              <p className="px-3 text-sm font-medium truncate mt-1">{user?.email}</p>
            </div>
            <form action={logout}>
              <button 
                type="submit" 
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Log out
              </button>
            </form>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
