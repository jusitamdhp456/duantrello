create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    actor_id uuid references public.profiles(id) on delete set null,
    workspace_id uuid references public.workspaces(id) on delete cascade,
    type text not null,
    title text not null,
    message text,
    link_url text,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật RLS
alter table public.notifications enable row level security;

-- Chính sách: Ai cũng có thể insert (để tự động hóa khi tạo hành động) nhưng chỉ có người nhận mới được select/update.
-- Insert: Mọi người đều có thể insert (Authenticated)
create policy "Anyone can insert notifications" 
    on public.notifications 
    for insert 
    to authenticated 
    with check (true);

-- Select: Chỉ xem được thông báo của chính mình
create policy "Users can view their own notifications" 
    on public.notifications 
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- Update: Chỉ update được thông báo của chính mình (để mark as read)
create policy "Users can update their own notifications" 
    on public.notifications 
    for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Delete: Chỉ delete được thông báo của chính mình
create policy "Users can delete their own notifications" 
    on public.notifications 
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Enable Realtime cho bảng notifications
alter publication supabase_realtime add table public.notifications;
