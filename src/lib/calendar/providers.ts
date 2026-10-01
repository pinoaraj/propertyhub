import { google, calendar_v3 } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { prisma } from '@/lib/prisma/client';
import type { TimeSlot, CalendarEventInput, CalendarEvent, CalendarProvider } from '@/types';

export interface ICalendarProvider {
  getAvailability(startDate: Date, endDate: Date): Promise<TimeSlot[]>;
  createEvent(event: CalendarEventInput): Promise<{ eventId: string; link: string }>;
  deleteEvent(eventId: string): Promise<boolean>;
  syncEvents(): Promise<void>;
}

export interface CalendarCredentials {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
}

function isTokenExpired(tokenExpiry?: Date | null): boolean {
  if (!tokenExpiry) return true;
  return new Date() >= new Date(tokenExpiry.getTime() - 5 * 60 * 1000); // 5 min buffer
}

async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiry: Date }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiry: new Date(Date.now() + (credentials.expiry_date || 3600000)),
  };
}

async function refreshMicrosoftToken(refreshToken: string): Promise<{ accessToken: string; expiry: Date }> {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'Calendars.ReadWrite offline_access',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Microsoft token refresh failed: ${data.error_description}`);
  }

  return {
    accessToken: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000),
  };
}

export class GoogleCalendarProvider implements ICalendarProvider {
  private calendar: calendar_v3.Calendar;
  private calendarId: string;
  private userId: string;
  private providerAccountId: string;

  constructor(credentials: CalendarCredentials, userId: string, providerAccountId: string) {
    this.calendarId = credentials.calendarId || 'primary';
    this.userId = userId;
    this.providerAccountId = providerAccountId;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.tokenExpiry?.getTime(),
    });

    // Auto-refresh token if needed
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token || tokens.access_token) {
        await prisma.connectedAccount.update({
          where: { userId_provider: { userId, provider: 'GOOGLE' } },
          data: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          },
        });
      }
    });

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getAvailability(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: 'UTC',
        items: [{ id: this.calendarId }],
      },
    });

    const busy = response.data.calendars?.[this.calendarId]?.busy || [];
    const slots: TimeSlot[] = [];

    let current = new Date(startDate);
    for (const period of busy) {
      const busyStart = new Date(period.start!);
      const busyEnd = new Date(period.end!);

      if (current < busyStart) {
        slots.push({ start: current, end: busyStart, isAvailable: true });
      }
      slots.push({ start: busyStart, end: busyEnd, isAvailable: false });
      current = busyEnd;
    }

    if (current < endDate) {
      slots.push({ start: current, end: endDate, isAvailable: true });
    }

    return slots;
  }

  async createEvent(event: CalendarEventInput): Promise<{ eventId: string; link: string }> {
    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map((email) => ({ email })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
      sendUpdates: 'all',
    });

    return {
      eventId: response.data.id!,
      link: response.data.htmlLink!,
    };
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId,
        sendUpdates: 'all',
      });
      return true;
    } catch {
      return false;
    }
  }

  async syncEvents(): Promise<void> {
    // Implement sync logic if needed
    await prisma.connectedAccount.update({
      where: { userId_provider: { userId: this.userId, provider: 'GOOGLE' } },
      data: { lastSyncAt: new Date() },
    });
  }
}

export class MicrosoftCalendarProvider implements ICalendarProvider {
  private client: Client;
  private calendarId: string;
  private userId: string;
  private providerAccountId: string;

  constructor(credentials: CalendarCredentials, userId: string, providerAccountId: string) {
    this.calendarId = credentials.calendarId || 'primary';
    this.userId = userId;
    this.providerAccountId = providerAccountId;

    const authProvider = {
      getAccessToken: async () => credentials.accessToken,
    } as any;

    this.client = Client.initWithMiddleware({ authProvider });
  }

  async getAvailability(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const response = await this.client
      .api(`/me/calendarView`)
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $select: 'start,end',
        $orderby: 'start/dateTime',
        $top: 100,
      })
      .get();

    const busy = response.value || [];
    const slots: TimeSlot[] = [];

    let current = new Date(startDate);
    for (const event of busy) {
      const busyStart = new Date(event.start.dateTime);
      const busyEnd = new Date(event.end.dateTime);

      if (current < busyStart) {
        slots.push({ start: current, end: busyStart, isAvailable: true });
      }
      slots.push({ start: busyStart, end: busyEnd, isAvailable: false });
      current = busyEnd;
    }

    if (current < endDate) {
      slots.push({ start: current, end: endDate, isAvailable: true });
    }

    return slots;
  }

  async createEvent(event: CalendarEventInput): Promise<{ eventId: string; link: string }> {
    const response = await this.client
      .api(`/me/events`)
      .post({
        subject: event.summary,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map((email) => ({
          emailAddress: { address: email },
          type: 'required',
        })),
        location: event.location ? { displayName: event.location } : undefined,
        reminderMinutesBeforeStart: 30,
        isReminderOn: true,
      });

    return {
      eventId: response.id,
      link: response.webLink,
    };
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.client.api(`/me/events/${eventId}`).delete();
      return true;
    } catch {
      return false;
    }
  }

  async syncEvents(): Promise<void> {
    await prisma.connectedAccount.update({
      where: { userId_provider: { userId: this.userId, provider: 'MICROSOFT' } },
      data: { lastSyncAt: new Date() },
    });
  }
}

export async function getCalendarProvider(
  userId: string,
  provider: CalendarProvider
): Promise<ICalendarProvider | null> {
  const connectedAccount = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!connectedAccount || !connectedAccount.isActive) {
    return null;
  }

  // Check and refresh token if expired
  let accessToken = connectedAccount.accessToken;
  let tokenExpiry = connectedAccount.tokenExpiry;

  if (isTokenExpired(tokenExpiry) && connectedAccount.refreshToken) {
    try {
      let newCredentials;
      if (provider === 'GOOGLE') {
        newCredentials = await refreshGoogleToken(connectedAccount.refreshToken);
      } else {
        newCredentials = await refreshMicrosoftToken(connectedAccount.refreshToken);
      }

      accessToken = newCredentials.accessToken;
      tokenExpiry = newCredentials.expiry;

      await prisma.connectedAccount.update({
        where: { userId_provider: { userId, provider } },
        data: { accessToken, tokenExpiry },
      });
    } catch (error) {
      console.error(`Failed to refresh ${provider} token:`, error);
      await prisma.connectedAccount.update({
        where: { userId_provider: { userId, provider } },
        data: { isActive: false },
      });
      return null;
    }
  }

  const credentials: CalendarCredentials = {
    accessToken,
    refreshToken: connectedAccount.refreshToken ?? undefined,
    tokenExpiry: tokenExpiry ?? undefined,
    calendarId: connectedAccount.calendarId || undefined,
  };

  if (provider === 'GOOGLE') {
    return new GoogleCalendarProvider(credentials, userId, connectedAccount.providerAccountId);
  } else {
    return new MicrosoftCalendarProvider(credentials, userId, connectedAccount.providerAccountId);
  }
}

export async function getAllCalendarProviders(userId: string): Promise<ICalendarProvider[]> {
  const providers: ICalendarProvider[] = [];

  const googleProvider = await getCalendarProvider(userId, 'GOOGLE');
  if (googleProvider) providers.push(googleProvider);

  const microsoftProvider = await getCalendarProvider(userId, 'MICROSOFT');
  if (microsoftProvider) providers.push(microsoftProvider);

  return providers;
}