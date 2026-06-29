'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createBoard(name: string, workspaceId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('boards')
    .insert({ name, workspace_id: workspaceId })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/boards')
  return data
}

export async function createList(name: string, boardId: string, position: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lists')
    .insert({ name, board_id: boardId, position })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/boards/${boardId}`)
  return data
}

export async function createCard(title: string, listId: string, position: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cards')
    .insert({ title, list_id: listId, position })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateCardPosition(cardId: string, newListId: string, newPosition: number, boardId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('cards')
    .update({ list_id: newListId, position: newPosition })
    .eq('id', cardId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/boards/${boardId}`)
}

export async function updateListPosition(listId: string, newPosition: number, boardId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('lists')
    .update({ position: newPosition })
    .eq('id', listId)

  if (error) throw new Error(error.message)

  revalidatePath(`/boards/${boardId}`)
}
