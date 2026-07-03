import { createClient } from "@/lib/supabase/server";
import { getMeetings } from "@/app/actions/meetings";
import MeetingList from "@/components/meetings/MeetingList";

export const metadata = {
  title: "Meetings | CreativeOS",
  description: "Lên lịch, ghi chú và theo dõi cuộc họp của team",
};

export default async function MeetingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's first workspace to pre-load meetings
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user?.id || "")
    .limit(1)
    .single();

  let meetings: Awaited<ReturnType<typeof getMeetings>> = [];
  if (membership?.workspace_id) {
    try {
      meetings = await getMeetings(membership.workspace_id);
    } catch {
      meetings = [];
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <MeetingList initialMeetings={meetings} />
    </div>
  );
}
