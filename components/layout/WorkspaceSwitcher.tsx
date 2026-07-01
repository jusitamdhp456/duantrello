"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createWorkspace } from "@/app/actions/workspaces";

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return <div className="text-sm text-gray-500 px-3">Loading workspaces...</div>;
  }

  const handleCreate = async () => {
    const name = window.prompt("Enter new workspace name:");
    if (!name) return;
    try {
      setIsCreating(true);
      const ws = await createWorkspace(name);
      // Optional: Wait for the next refresh or manually set it if provider allows, 
      // but reloading is easiest since provider will refetch
      window.location.reload();
    } catch (error) {
      alert("Failed to create workspace");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="px-3">
        <div className="text-sm text-gray-500 mb-2">No workspaces found</div>
        <button 
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <Plus size={16} />
          {isCreating ? "Creating..." : "Create Workspace"}
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 mb-6 mt-4">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="workspace-select" className="text-xs font-medium text-gray-500 uppercase tracking-wider block">
          Workspace
        </label>
        <button 
          onClick={handleCreate}
          disabled={isCreating}
          className="text-gray-400 hover:text-blue-500 transition-colors p-1"
          title="Create Workspace"
        >
          <Plus size={16} />
        </button>
      </div>
      <select
        id="workspace-select"
        value={activeWorkspaceId || ""}
        onChange={(e) => setActiveWorkspaceId(e.target.value)}
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-black focus:outline-none focus:ring-black mb-2"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
    </div>
  );
}
