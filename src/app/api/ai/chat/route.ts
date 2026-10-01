import { auth } from '@/lib/auth/auth';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tools } from '@/lib/ai/tools';
import { prisma } from '@/lib/prisma/client';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, ticketId } = await req.json();

    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { provider: true },
    });

    const hasGoogle = connectedAccounts.some((a) => a.provider === 'GOOGLE');
    const hasMicrosoft = connectedAccounts.some((a) => a.provider === 'MICROSOFT');

    const systemPrompt = `You are PropertyHub's AI Assistant, a proactive virtual assistant for property management.

You help property managers with:
- Checking calendar availability (Google: ${hasGoogle ? 'connected' : 'not connected'}, Microsoft: ${hasMicrosoft ? 'connected' : 'not connected'})
- Scheduling maintenance visits
- Creating and managing maintenance tickets
- Summarizing daily agendas
- Getting ticket details and updating statuses

Current user: ${session.user.name} (${session.user.role})
${ticketId ? `Current ticket context: ${ticketId}` : ''}

Guidelines:
- Be concise and action-oriented
- Use tools proactively when users ask about scheduling, availability, or tickets
- When creating tickets, ask for missing required info (unit number, description, category)
- When scheduling, confirm the time slot before booking
- Show calendar links when events are created
- If a provider isn't connected, guide them to Settings > Calendar Connections

Available tools:
- checkCalendarFreebusy: Check availability across calendars
- scheduleMaintenanceVisit: Book a visit and link to ticket
- createMaintenanceTicket: Create new maintenance ticket
- summarizeDailyAgenda: Get today's agenda
- getTicketDetails: Get full ticket info
- updateTicketStatus: Change ticket status
- assignTicket: Assign to technician
- listUserTickets: List user's tickets`;

    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 5,
      onFinish: async ({ response }) => {
        if (ticketId) {
          const lastMessage = response.messages[response.messages.length - 1];
          const content = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
          const toolCalls = response.messages.flatMap((m) => {
            if (Array.isArray(m.content)) {
              return m.content.filter((p: any) => p.type === 'tool-call').map((p: any) => ({ id: p.toolCallId, name: p.toolName, arguments: p.args }));
            }
            return [];
          });
          const toolResults = response.messages.flatMap((m) => {
            if (Array.isArray(m.content)) {
              return m.content.filter((p: any) => p.type === 'tool-result').map((p: any) => ({ toolCallId: p.toolCallId, name: p.toolName, result: p.result }));
            }
            return [];
          });
          await prisma.chatMessage.create({
            data: {
              role: 'assistant',
              content,
              userId: session.user.id,
              ticketId,
              toolCalls,
              toolResults,
            },
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}