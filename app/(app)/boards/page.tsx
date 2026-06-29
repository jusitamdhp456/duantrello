"use client";

import Link from 'next/link';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createBoard } from '@/app/actions/boards';
import { Loader2 } from 'lucide-react';

export default function BoardsPage() {
  const { activeWorkspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
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
    return <div className="p-8 flex items-center"><Loader2 className="animate-spin mr-2" /> Loading workspace...</div>;
  }

  if (!activeWorkspaceId) {
    return <div className="p-8 text-gray-500">Please select a workspace first.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Boards</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center"><Loader2 className="animate-spin mr-2" /> Loading boards...</div>
        ) : (
          <>
            {boards.map((board) => (
              <Link 
                key={board.id} 
                href={`/boards/${board.id}`}
                className="block h-32 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{board.name}</h3>
              </Link>
            ))}

            <form onSubmit={handleCreateBoard} className="h-32 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
              <input 
                type="text" 
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="New board title..." 
                className="w-full text-sm p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
              <button type="submit" className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition">
                Create Board
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
