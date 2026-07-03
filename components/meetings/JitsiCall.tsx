"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface Props {
  roomName: string;      // e.g. "duantrello-meeting-abc123"
  displayName: string;
  isOngoing: boolean;
}

export default function JitsiCall({ roomName, displayName, isOngoing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    if (!isOngoing) return;

    // Load Jitsi script
    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => initJitsi();
      document.head.appendChild(script);
    };

    const initJitsi = () => {
      if (!containerRef.current || apiRef.current) return;

      const domain = "meet.jit.si";
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          enableNoisyMicDetection: false,
          prejoinPageEnabled: false,
          disableInitialGUM: false,
          toolbarButtons: [
            "microphone",
            "camera",
            "closedcaptions",
            "desktop",
            "embedmeeting",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "chat",
            "raisehand",
            "videoquality",
            "filmstrip",
            "feedback",
            "stats",
            "shortcuts",
            "tileview",
            "videobackgroundblur",
            "download",
            "mute-everyone",
            "security",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
          TOOLBAR_ALWAYS_VISIBLE: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
        },
        userInfo: {
          displayName: displayName,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListener("videoConferenceJoined", () => {
        setLoaded(true);
      });

      apiRef.current.addEventListener("participantJoined", () => {
        setParticipantCount((prev) => prev + 1);
      });

      apiRef.current.addEventListener("participantLeft", () => {
        setParticipantCount((prev) => Math.max(1, prev - 1));
      });
    };

    loadJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, isOngoing]);

  if (!isOngoing) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="text-7xl">🎥</div>
        <p className="text-gray-500 font-medium text-lg">Cuộc họp chưa bắt đầu</p>
        <p className="text-gray-400 text-sm max-w-xs">
          Bấm <strong>"Bắt đầu họp"</strong> ở trên để khởi động phòng video call và mời mọi người tham gia.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-900">
      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 z-10">
          <div className="flex gap-2">
            <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-white/70 text-sm">Đang kết nối phòng họp...</p>
          <p className="text-white/40 text-xs">Camera & Mic sẽ được yêu cầu quyền truy cập</p>
        </div>
      )}

      {/* Participant count badge */}
      {loaded && (
        <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {participantCount} người tham gia
        </div>
      )}

      {/* Jitsi iframe mount point */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
