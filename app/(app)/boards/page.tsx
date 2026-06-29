"use client";

import Link from 'next/link';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createBoard } from '@/app/actions/boards';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function BoardsPage() {
  const { activeWorkspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const { t } = useLanguage();
  const [boards, setBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchBoards() {
      if (!activeWorkspaceId) {
        setBoards([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data } = await supabase
        .from('boards')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false });
        
      setBoards(data || []);
      setIsLoading(false);
    }
    
    fetchBoards();
  }, [activeWorkspaceId, supabase]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !activeWorkspaceId) return;
    
    try {
      const newBoard = await createBoard(newBoardName, activeWorkspaceId);
      setBoards([newBoard, ...boards]);
      setNewBoardName("");
    } catch (err) {
      console.error(err);
    }
  };

  if (isWorkspaceLoading) {
    return <div className="p-8 flex items-center"><Loader2 className="animate-spin mr-2" /> {t("loading")}</div>;
  }

  if (!activeWorkspaceId) {
    return <div className="p-8 text-gray-500">{t("select_workspace")}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">{t("boards")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
        ) : (
          <>
            {boards.map((board) => (
              <Link 
                key={board.id} 
                href={`/boards/${board.id}`}
                className="block h-32 bg-neu-base shadow-neu-convex rounded-2xl p-6 hover:shadow-neu-concave transition-all duration-300 group flex items-center justify-center"
              >
                <h3 className="font-semibold text-xl text-gray-700 group-hover:text-blue-600 transition tracking-wide text-center">{board.name}</h3>
              </Link>
            ))}

            <form onSubmit={handleCreateBoard} className="h-32 bg-neu-base shadow-neu-concave rounded-2xl p-4 flex flex-col items-center justify-center border-none">
              <input 
                type="text" 
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder={t("new_board")}
                className="w-full text-sm p-3 mb-3 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium text-center placeholder-gray-400"
                required
              />
              <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs py-2.5 rounded-full font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave transition-all">
                {t("create_board")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
