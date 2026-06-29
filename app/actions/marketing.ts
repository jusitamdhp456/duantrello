'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createCampaign(name: string, workspaceId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, workspace_id: workspaceId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/campaigns')
  return data
}

export async function createBrief(briefData: any, workspaceId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('creative_briefs')
    .insert({ ...briefData, workspace_id: workspaceId, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/creative-briefs')
  return data
}

export async function createVideoAd(adData: any, workspaceId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_ads')
    .insert({ ...adData, workspace_id: workspaceId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/video-ads')
  return data
}

export async function generateTasksFromBrief(briefId: string, workspaceId: string) {
  const supabase = createClient()
  
  const { data: brief, error: briefErr } = await supabase
    .from('creative_briefs')
    .select('*')
    .eq('id', briefId)
    .single()

  if (briefErr || !brief) throw new Error(briefErr?.message || "Brief not found")

  // 1. Create a board
  const { data: board, error: boardErr } = await supabase
    .from('boards')
    .insert({ name: `[Brief] ${brief.title}`, workspace_id: workspaceId })
    .select().single()

  if (boardErr) throw new Error(boardErr.message)

  // 2. Create Lists
  const listNames = ['To Do', 'In Progress', 'Review', 'Done']
  const createdLists = []
  for (let i = 0; i < listNames.length; i++) {
    const { data: list } = await supabase
      .from('lists')
      .insert({ name: listNames[i], board_id: board.id, position: i * 1024 })
      .select().single()
    if (list) createdLists.push(list)
  }

  // 3. Create initial task cards in "To Do"
  const todoList = createdLists[0]
  if (todoList) {
    const defaultTasks = [
      `Review Brief: ${brief.title}`,
      `Source Media Assets for Angle: ${brief.angle || 'Main'}`,
      `Edit V1 for ${brief.platform || 'General'}`,
      `Design Thumbnail`
    ]

    for (let i = 0; i < defaultTasks.length; i++) {
      await supabase
        .from('cards')
        .insert({
          title: defaultTasks[i],
          description: `Generated from Brief ID: ${brief.id}`,
          list_id: todoList.id,
          position: i * 1024
        })
    }
  }

  // Mark brief as active
  await supabase
    .from('creative_briefs')
    .update({ status: 'active' })
    .eq('id', briefId)

  revalidatePath('/creative-briefs')
  return board.id
}
