import TasksView from "@/components/tasks/TasksView";

export const metadata = {
  title: "Công việc cần làm | Creative OS",
  description: "Quản lý công việc cần làm",
};

export default function TasksPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-neu-base/50">
      <TasksView />
    </div>
  );
}
