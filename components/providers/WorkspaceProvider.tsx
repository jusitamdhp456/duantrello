"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeRole: 'admin' | 'manager' | 'member' | 'guest';
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [roles, setRoles] = useState<Record<string, 'admin' | 'manager' | 'member' | 'guest'>>({});
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsLoading(false);
          return;
        }

        // Lấy danh sách workspace và role tương ứng
        const { data, error } = await supabase
          .from("workspace_members")
          .select(`
            workspace_id,
            role,
            workspaces (
              id,
              name
            )
          `)
          .eq("user_id", userData.user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          // Lọc ra những bản ghi hợp lệ (có workspaces)
          const validData = data.filter(item => item.workspaces !== null);
          
          const wsList = validData.map(item => item.workspaces as unknown as Workspace);
          const roleMap: Record<string, 'admin' | 'manager' | 'member' | 'guest'> = {};
          
          validData.forEach(item => {
            const ws = item.workspaces as unknown as Workspace;
            roleMap[ws.id] = (item.role as any) || 'member';
          });

          setWorkspaces(wsList);
          setRoles(roleMap);
          // Set first workspace as active if none selected
          if (wsList.length > 0) {
            setActiveWorkspaceId(wsList[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaces();
  }, [supabase]);

  const activeRole = activeWorkspaceId && roles[activeWorkspaceId] ? roles[activeWorkspaceId] : 'member';

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspaceId, activeRole, setActiveWorkspaceId, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
