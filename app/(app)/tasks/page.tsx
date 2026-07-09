import TasksView from "@/components/tasks/TasksView";

export const metadata = {
  title: "Video Cần làm | Creative OS",
  description: "Quản lý video cần làm",
};

export default function TasksPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-neu-base/50">
      <TasksView />
    </div>
  );
}
