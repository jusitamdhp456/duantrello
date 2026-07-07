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
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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

        const { data, error } = await supabase
          .from("workspaces")
          .select("id, name");

        if (error) throw error;

        if (data && data.length > 0) {
          setWorkspaces(data);
          // Set first workspace as active if none selected
          setActiveWorkspaceId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaces();
  }, [supabase]);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading }}>
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
