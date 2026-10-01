'use client';

import { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayoutClient({ children, user }: { children: React.ReactNode; user: any }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen relative">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>

        {/* Chat Trigger Button */}
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 z-40 lg:hidden"
          onClick={() => setChatOpen(true)}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-5 w-5 mr-2" />
          Assistant
        </Button>

        {/* Desktop Chat Trigger */}
        <div className="hidden lg:fixed lg:bottom-6 lg:right-6 z-40">
          <Button
            variant="default"
            size="lg"
            onClick={() => setChatOpen(true)}
            aria-label="Open AI Assistant"
            className="shadow-lg"
          >
            <Bot className="h-5 w-5 mr-2" />
            AI Assistant
          </Button>
        </div>

        {/* Chat Drawer */}
        <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
}