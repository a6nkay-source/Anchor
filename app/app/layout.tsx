import { SignalsProvider } from "@/components/signals-store";
import { WellnessMonitorProvider } from "@/components/wellness-monitor";
import { FocusProvider, FocusOverlay } from "@/components/focus-mode";
import { MusicProvider, MusicPlayer } from "@/components/music-player";
import { AppSidebar } from "@/components/app-sidebar";
import { NudgeAgent } from "@/components/nudge-agent";
import { FloatingAssistant } from "@/components/floating-assistant";
import { MonitorPrompt } from "@/components/monitor-prompt";
import { EventDetector } from "@/components/event-detector";
import { EventToasts } from "@/components/event-toasts";
import { AchievementDetector } from "@/components/achievement-detector";
import { FocusGuardian } from "@/components/focus-guardian";
import { SessionSummary } from "@/components/session-summary";
import { DynamicTheme } from "@/components/dynamic-theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SignalsProvider>
      <WellnessMonitorProvider>
        <FocusProvider>
          <MusicProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div className="flex-1 overflow-x-hidden">
                <div className="mx-auto max-w-6xl p-6 md:p-10">
                  <MonitorPrompt />
                  {children}
                </div>
              </div>
            </div>
            <NudgeAgent />
            <EventDetector />
            <EventToasts />
            <AchievementDetector />
            <FocusGuardian />
            <SessionSummary />
            <FocusOverlay />
            <FloatingAssistant />
            <MusicPlayer />
            <DynamicTheme />
          </MusicProvider>
        </FocusProvider>
      </WellnessMonitorProvider>
    </SignalsProvider>
  );
}
