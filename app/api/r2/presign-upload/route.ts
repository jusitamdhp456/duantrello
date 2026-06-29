import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePresignedUploadUrl } from '@/lib/r2/presign';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, contentType, workspaceId } = await request.json();

    if (!filename || !contentType || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify workspace membership
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (error || !membership) {
      return NextResponse.json({ error: 'Forbidden - Not a member of this workspace' }, { status: 403 });
    }

    const fileExtension = filename.split('.').pop() || '';
    const uniqueId = crypto.randomUUID();
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/'); // YYYY/MM/DD
    const objectKey = `media/${workspaceId}/${datePath}/${uniqueId}.${fileExtension}`;

    const presignedUrl = await generatePresignedUploadUrl(objectKey, contentType);

    return NextResponse.json({ 
      url: presignedUrl, 
      objectKey, 
      bucket: process.env.R2_BUCKET_NAME 
    });
  } catch (err: any) {
    console.error("Presign upload error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
