import LeaderboardView from "@/components/leaderboard/LeaderboardView";

export const metadata = {
  title: "Bảng xếp hạng | Creative OS",
  description: "Bảng xếp hạng thành tích các thành viên",
};

export default function LeaderboardPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-neu-base/50">
      <LeaderboardView />
    </div>
  );
}
