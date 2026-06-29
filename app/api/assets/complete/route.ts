import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      workspaceId, 
      filename, 
      contentType, 
      size, 
      objectKey, 
      bucket 
    } = body;

    if (!workspaceId || !filename || !objectKey || !bucket) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let assetType = 'document';
    if (contentType.startsWith('video/')) assetType = 'raw_video';
    if (contentType.startsWith('image/')) assetType = 'image';
    if (contentType.startsWith('audio/')) assetType = 'audio';

    const { data, error } = await supabase
      .from('media_assets')
      .insert({
        workspace_id: workspaceId,
        uploaded_by: user.id,
        file_name: filename,
        file_type: contentType.split('/')[0] || 'unknown',
        mime_type: contentType,
        file_size: size,
        r2_bucket: bucket,
        r2_object_key: objectKey,
        asset_type: assetType,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting media asset:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, asset: data });
  } catch (err: any) {
    console.error("Complete upload error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
