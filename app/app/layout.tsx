import { SignalsProvider } from "@/components/signals-store";
import { WellnessMonitorProvider } from "@/components/wellness-monitor";
import { FocusProvider, FocusOverlay } from "@/components/focus-mode";
import { AppSidebar } from "@/components/app-sidebar";
import { NudgeAgent } from "@/components/nudge-agent";
import { FloatingAssistant } from "@/components/floating-assistant";
import { MonitorPrompt } from "@/components/monitor-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SignalsProvider>
      <WellnessMonitorProvider>
        <FocusProvider>
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
          <FocusOverlay />
          <FloatingAssistant />
        </FocusProvider>
      </WellnessMonitorProvider>
    </SignalsProvider>
  );
}
