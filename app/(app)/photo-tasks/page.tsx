import PhotoTasksView from "@/components/photo-tasks/PhotoTasksView";

export const metadata = {
  title: "Ảnh Cần làm | Creative OS",
  description: "Quản lý ảnh cần làm",
};

export default function PhotoTasksPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-neu-base/50">
      <PhotoTasksView />
    </div>
  );
}
