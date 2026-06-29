-- Trigger automatically creating a profile, workspace, and workspace_member upon signup

-- Function to handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  -- 1. Create profile
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- 2. Create default workspace
  insert into public.workspaces (name)
  values (coalesce(new.raw_user_meta_data->>'full_name', 'My') || ' Workspace')
  returning id into new_workspace_id;

  -- 3. Add user as member to the new workspace
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

-- Trigger for auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
