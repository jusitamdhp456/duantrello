import { createClient } from "@/lib/supabase/server";
import { getMeetingById } from "@/app/actions/meetings";
import MeetingRoom from "@/components/meetings/MeetingRoom";
import { notFound } from "next/navigation";

interface Props {
  params: { roomId: string };
}

export async function generateMetadata({ params }: Props) {
  const meeting = await getMeetingById(params.roomId);
  return {
    title: meeting ? `${meeting.title} | Meeting Room` : "Meeting Room",
  };
}

export default async function MeetingRoomPage({ params }: Props) {
  const meeting = await getMeetingById(params.roomId);
  if (!meeting) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id || "")
    .single();

  const currentUserName = profile?.full_name || user?.email?.split("@")[0] || "Người dùng";
  const currentUserEmail = user?.email || "";
  const workspaceId = meeting.workspace_id;

  return (
    // Full-screen: no padding, fills the entire app area
    <div className="flex-1 flex flex-col -m-4 md:-m-6 lg:-m-8 h-[calc(100vh-0px)]">
      <MeetingRoom
        meeting={meeting}
        workspaceId={workspaceId}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
