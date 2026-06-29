"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading } = useWorkspace();

  if (isLoading) {
    return <div className="text-sm text-gray-500 px-3">Loading workspaces...</div>;
  }

  if (workspaces.length === 0) {
    return <div className="text-sm text-gray-500 px-3">No workspaces found</div>;
  }

  return (
    <div className="px-3 mb-6 mt-4">
      <label htmlFor="workspace-select" className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
        Workspace
      </label>
      <select
        id="workspace-select"
        value={activeWorkspaceId || ""}
        onChange={(e) => setActiveWorkspaceId(e.target.value)}
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-black focus:outline-none focus:ring-black"
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
