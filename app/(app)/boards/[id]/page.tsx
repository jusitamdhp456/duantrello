import { createClient } from '@/lib/supabase/server';
import KanbanBoard from '@/components/boards/KanbanBoard';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BoardDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!board) {
    return <div className="p-8">Board not found</div>;
  }

  const { data: lists } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', params.id)
    .order('position', { ascending: true });

  const listIds = lists?.map(l => l.id) || [];
  
  let cards: any[] = [];
  if (listIds.length > 0) {
    const { data: fetchCards } = await supabase
      .from('cards')
      .select('*')
      .in('list_id', listIds)
      .order('position', { ascending: true });
    cards = fetchCards || [];
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/boards" className="text-gray-500 hover:text-black transition">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold">{board.name}</h1>
        </div>
      </div>

      <div className="flex-1">
        <KanbanBoard boardId={board.id} initialLists={lists || []} initialCards={cards} />
      </div>
    </div>
  );
}
