-- Migration for allowing workspace creation from UI

-- Allow authenticated users to insert new workspaces
create policy "Users can create workspaces"
on workspaces for insert to authenticated with check (true);

-- Allow authenticated users to insert themselves as owner to a workspace
create policy "Users can add themselves to workspaces"
on workspace_members for insert to authenticated with check (user_id = auth.uid());
