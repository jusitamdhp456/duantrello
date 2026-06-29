'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveAdMetrics(adId: string, workspaceId: string, metrics: any) {
  const supabase = createClient()
  
  // Upsert metric for today
  const { error } = await supabase
    .from('ad_metrics')
    .upsert(
      { 
        video_ad_id: adId, 
        workspace_id: workspaceId, 
        date_recorded: new Date().toISOString().split('T')[0],
        spend: metrics.spend || 0,
        roas: metrics.roas || 0,
        clicks: metrics.clicks || 0,
        impressions: metrics.impressions || 0,
        conversions: metrics.conversions || 0
      },
      { onConflict: 'video_ad_id,date_recorded' }
    )

  if (error) throw new Error(error.message)
  
  revalidatePath('/analytics')
}

export async function approveVideoAdAndAwardPoints(adId: string, workspaceId: string) {
  const supabase = createClient()
  
  // 1. Update status
  const { error: updateErr, data: ad } = await supabase
    .from('video_ads')
    .update({ approval_status: 'approved' })
    .eq('id', adId)
    .select('brief_id')
    .single()
    
  if (updateErr) throw new Error(updateErr.message)

  // 2. Award points to the creator of the brief (as a simplified stand-in for the editor)
  if (ad && ad.brief_id) {
    const { data: brief } = await supabase
      .from('creative_briefs')
      .select('created_by')
      .eq('id', ad.brief_id)
      .single()

    if (brief && brief.created_by) {
      await supabase.rpc('award_user_points', {
        p_user_id: brief.created_by,
        p_workspace_id: workspaceId,
        p_amount: 10,
        p_reason: `Video Ad approved (Ad ID: ${adId})`
      })
    }
  }

  revalidatePath('/video-ads')
  revalidatePath('/leaderboard')
}
