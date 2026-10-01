'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { X, Send, Mic, Paperclip, Bot, User, Loader2, CheckCircle, AlertCircle, Calendar, Wrench, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  toolResults?: Array<{ toolCallId: string; name: string; result: unknown; error?: string }>;
  createdAt: Date;
}

interface ActionCard {
  type: 'confirm_event' | 'create_ticket' | 'schedule_visit';
  title: string;
  description: string;
  data: Record<string, unknown>;
  onConfirm: () => void;
  onCancel: () => void;
}

const quickActions = [
  { label: 'Today\'s Agenda', prompt: 'Give me a summary of today\'s agenda', icon: Calendar },
  { label: 'Check Availability', prompt: 'Check my calendar availability for tomorrow', icon: Zap },
  { label: 'Create Ticket', prompt: 'Create a new maintenance ticket', icon: FileText },
  { label: 'Schedule Visit', prompt: 'Schedule a maintenance visit', icon: Wrench },
];

export function ChatDrawer({ isOpen, onClose, ticketId }: { isOpen: boolean; onClose: () => void; ticketId?: string }) {
  const [input, setInput] = useState('');
  const [actionCard, setActionCard] = useState<ActionCard | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, append, status, stop, setMessages } = useChat({
    api: '/api/ai/chat',
    body: { ticketId },
    onFinish: (message) => {
      if (message.toolCalls?.length) {
        // Check for action cards in tool results
        const actionTool = message.toolCalls.find((tc) => tc.name === 'scheduleMaintenanceVisit' || tc.name === 'createMaintenanceTicket');
        if (actionTool) {
          setActionCard({
            type: actionTool.name === 'scheduleMaintenanceVisit' ? 'confirm_event' : 'create_ticket',
            title: actionTool.name === 'scheduleMaintenanceVisit' ? 'Confirm Calendar Event' : 'Confirm Ticket Creation',
            description: 'Review the details before confirming',
            data: actionTool.arguments as Record<string, unknown>,
            onConfirm: () => {
              // The tool already executed, just close the card
              setActionCard(null);
            },
            onCancel: () => {
              setActionCard(null);
            },
          });
        }
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'submitting') return;

    const userMessage = input;
    setInput('');

    // Save user message to history
    await append({ role: 'user', content: userMessage });
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    handleSubmit(new Event('submit') as React.FormEvent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-xl border-l animate-slide-in-right" role="dialog" aria-label="AI Assistant">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">PropertyHub Assistant</h3>
              <p className="text-xs text-muted-foreground">AI-powered property management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 justify-start gap-2 text-xs"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={status === 'submitting'}
              >
                <action.icon className="h-3.5 w-3.5" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">How can I help you today?</p>
              <p className="text-xs mt-1">Try asking about your schedule, creating tickets, or checking availability.</p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message as ChatMessage} />
          ))}
          {status === 'streaming' && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Action Card */}
        {actionCard && (
          <ActionCardComponent card={actionCard} onClose={() => setActionCard(null)} />
        )}

        {/* Input */}
        <div className="p-4 border-t bg-background/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="pr-12"
                disabled={status === 'submitting'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!input.trim() || status === 'submitting'}
              aria-label="Send message"
            >
              {status === 'submitting' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by AI • {'Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('flex-1 max-w-[calc(100%-3rem)]', isUser ? 'text-right' : '')}>
        <div className={cn('inline-block px-4 py-2 rounded-2xl text-sm', isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none')}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={cn('text-xs text-muted-foreground mt-1 px-1', isUser ? 'text-right' : '')}>
          {formatTime(message.createdAt)}
        </p>
        {message.toolCalls?.length && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallBadge key={tc.id} name={tc.name} args={tc.arguments} />
            ))}
          </div>
        )}
        {message.toolResults?.length && (
          <div className="mt-2 space-y-1">
            {message.toolResults.map((tr) => (
              <ToolResultBadge key={tr.toolCallId} name={tr.name} result={tr.result} error={tr.error} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallBadge({ name, args }: { name: string; args: Record<string, unknown> }) {
  const icons: Record<string, React.ReactNode> = {
    checkCalendarFreebusy: <Zap className="h-3 w-3" />,
    scheduleMaintenanceVisit: <Calendar className="h-3 w-3" />,
    createMaintenanceTicket: <FileText className="h-3 w-3" />,
    summarizeDailyAgenda: <Calendar className="h-3 w-3" />,
    getTicketDetails: <FileText className="h-3 w-3" />,
    updateTicketStatus: <Wrench className="h-3 w-3" />,
    assignTicket: <User className="h-3 w-3" />,
    listUserTickets: <FileText className="h-3 w-3" />,
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
      {icons[name] || <Zap className="h-3 w-3" />}
      <span>{name}</span>
    </div>
  );
}

function ToolResultBadge({ name, result, error }: { name: string; result: unknown; error?: string }) {
  if (error) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
        <AlertCircle className="h-3 w-3" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full">
      <CheckCircle className="h-3 w-3" />
      <span>Completed</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="inline-flex items-center gap-1 px-4 py-2 bg-muted rounded-2xl rounded-tl-none">
          <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ActionCardComponent({ card, onClose }: { card: ActionCard; onClose: () => void }) {
  return (
    <Card className="mx-4 mb-4 border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="font-medium">{card.title}</h4>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          {Object.entries(card.data).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={card.onConfirm}>Confirm</Button>
        </div>
      </CardContent>
    </Card>
  );
}