"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Plus, Edit2 } from "lucide-react";
import { useState } from "react";
import { createWorkspace, updateWorkspaceName } from "@/app/actions/workspaces";

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

  const handleEdit = async () => {
    if (!activeWorkspaceId) return;
    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    if (!currentWorkspace) return;
    
    const newName = window.prompt("Enter new workspace name:", currentWorkspace.name);
    if (!newName || newName === currentWorkspace.name) return;
    
    try {
      setIsCreating(true); // Reusing the loading state
      await updateWorkspaceName(activeWorkspaceId, newName);
      window.location.reload();
    } catch (error) {
      alert("Failed to update workspace name. You might not have permission.");
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
          className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
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
        <div className="flex items-center gap-1">
          <button 
            onClick={handleEdit}
            disabled={isCreating}
            className="text-gray-400 hover:text-blue-400 transition-colors p-1"
            title="Edit Workspace Name"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="text-gray-400 hover:text-blue-400 transition-colors p-1"
            title="Create Workspace"
          >
            <Plus size={16} />
          </button>
        </div>
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
