import { createClient } from "@/lib/supabase/server";
import { getMeetingById } from "@/app/actions/meetings";
import MeetingRoom from "@/components/meetings/MeetingRoom";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: { roomId: string };
}

export async function generateMetadata({ params }: Props) {
  const meeting = await getMeetingById(params.roomId);
  return {
    title: meeting ? `${meeting.title} | Meetings | CreativeOS` : "Meeting | CreativeOS",
  };
}

export default async function MeetingRoomPage({ params }: Props) {
  const meeting = await getMeetingById(params.roomId);
  if (!meeting) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id || "")
    .single();

  const currentUserName = profile?.full_name || user?.email?.split("@")[0] || "Ẩn danh";
  const currentUserEmail = user?.email || "";

  // Get workspace id from meeting
  const workspaceId = meeting.workspace_id;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Back button */}
      <div className="flex items-center">
        <Link
          href="/meetings"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại Meetings
        </Link>
      </div>

      <MeetingRoom
        meeting={meeting}
        workspaceId={workspaceId}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
