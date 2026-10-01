# PropertyHub

AI-powered property management platform with conversational assistant, dual calendar integration (Google + Microsoft), and maintenance ticket management.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend:** Next.js Server Actions / API Routes, Node.js (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth v5 (Google + Microsoft OAuth with calendar scopes + refresh tokens)
- **AI:** Vercel AI SDK v3 with OpenAI GPT-4o (function calling)
- **State:** Zustand / TanStack Query

## Features

- Dual calendar integration (Google Calendar + Microsoft Outlook) with auto token refresh
- Conversational AI Assistant with 8 function calling tools
- Maintenance ticket management with full CRUD and status workflow
- Calendar view for scheduled visits
- Property/Unit management with occupancy tracking
- Settings page for calendar connections
- Repository pattern (NestFlow architecture)
- AI structured outputs with Zod validation
- Audit logging system

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project (for OAuth)
- Azure Portal app registration (for Microsoft OAuth)
- OpenAI API key

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/propertyhub"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="xxx"
MICROSOFT_CLIENT_SECRET="xxx"
MICROSOFT_TENANT_ID="common"

# AI
OPENAI_API_KEY="sk-xxx"
```

### Installation

```bash
npm install
npx prisma migrate deploy
npm run dev
```

### Database Setup

```bash
# Create migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── properties/page.tsx
│   │       ├── settings/page.tsx
│   │       └── tickets/
│   │           ├── page.tsx
│   │           ├── new/page.tsx
│   │           └── [id]/page.tsx
│   └── api/
│       ├── ai/chat/route.ts
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       ├── settings/calendar/disconnect/route.ts
│       ├── settings/calendar/sync/route.ts
│       └── tickets/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               └── status/route.ts
├── components/
│   ├── chat/chat-drawer.tsx
│   ├── dashboard/
│   └── ui/
├── lib/
│   ├── ai/
│   │   ├── client.ts
│   │   ├── schemas.ts
│   │   ├── services.ts
│   │   └── tools.ts
│   ├── auth/auth.ts
│   ├── calendar/providers.ts
│   ├── db/repositories/
│   ├── prisma/client.ts
│   └── utils.ts
├── types/index.ts
├── middleware.ts
└── prisma/schema.prisma
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/chat | Streaming AI chat with tool calling |
| POST | /api/auth/register | User registration |
| GET | /api/tickets | List tickets |
| POST | /api/tickets | Create ticket |
| GET | /api/tickets/[id] | Get ticket details |
| PATCH | /api/tickets/[id] | Update ticket |
| DELETE | /api/tickets/[id] | Delete ticket |
| PATCH | /api/tickets/[id]/status | Update ticket status |
| POST | /api/settings/calendar/disconnect | Disconnect calendar |
| POST | /api/settings/calendar/sync | Sync calendar |

## AI Assistant Tools

| Tool | Description |
|------|-------------|
| checkCalendarFreebusy | Check availability across calendars |
| scheduleMaintenanceVisit | Book a visit and link to ticket |
| createMaintenanceTicket | Create new maintenance ticket |
| summarizeDailyAgenda | Get today's agenda |
| getTicketDetails | Get full ticket info |
| updateTicketStatus | Change ticket status |
| assignTicket | Assign to technician |
| listUserTickets | List user's tickets |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database (Neon)

1. Create project at neon.tech
2. Copy connection string
3. Set as DATABASE_URL
4. Run `npx prisma migrate deploy`

## License

MIT