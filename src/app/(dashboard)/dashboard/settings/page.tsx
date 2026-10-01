'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Calendar, CheckCircle, AlertCircle, Loader2, ExternalLink, RefreshCw, Unlink, Bot, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const providers = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Sync with Google Calendar for scheduling maintenance visits',
    icon: Calendar,
    color: 'bg-blue-500',
    scopes: ['calendar.events'],
  },
  // Microsoft OAuth disabled for now
  // {
  //   id: 'microsoft',
  //   name: 'Microsoft Outlook',
  //   description: 'Connect to Microsoft 365 / Outlook Calendar',
  //   icon: Calendar,
  //   color: 'bg-indigo-500',
  //   scopes: ['Calendars.ReadWrite'],
  // },
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const handleConnect = async (providerId: string) => {
    setSyncing(providerId);
    try {
      await signIn(providerId === 'google' ? 'google' : 'microsoft-entra-id', {
        callbackUrl: '/dashboard/settings',
      });
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setSyncing(providerId);
    try {
      await fetch('/api/settings/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      setConnected((prev) => ({ ...prev, [providerId]: false }));
      update();
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleSync = async (providerId: string) => {
    setSyncing(providerId);
    try {
      await fetch('/api/settings/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      update();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and integrations</p>
      </div>

      {/* Calendar Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Connections
              </CardTitle>
              <CardDescription>Connect your calendars to enable AI scheduling</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => {
            const isConnected = connected[provider.id] || false;
            const isSyncingProvider = syncing === provider.id;

            return (
              <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl', provider.color, 'text-white')}>
                    <provider.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {provider.scopes.map((scope) => (
                        <span key={scope} className="text-xs px-2 py-0.5 bg-muted rounded">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(provider.id)}
                        disabled={isSyncingProvider}
                        className="gap-1"
                      >
                        {isSyncingProvider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Sync
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(provider.id)}
                        disabled={isSyncingProvider}
                        className="gap-1"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={isSyncingProvider}
                      className="gap-2"
                    >
                      {isSyncingProvider ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Connect {provider.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Auto-sync</h3>
              <p className="text-sm text-muted-foreground">
                Automatically sync calendar changes in real-time
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={true}
              onCheckedChange={() => {}}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <CardDescription>Configure AI assistant behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Proactive Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Get AI suggestions for scheduling and ticket management
              </p>
            </div>
            <Switch id="proactive" checked={true} onCheckedChange={() => {}} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Daily Summary</h3>
              <p className="text-sm text-muted-foreground">
                Receive daily agenda summary at start of day
              </p>
            </div>
            <Switch id="daily-summary" checked={false} onCheckedChange={() => {}} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Auto-create Tickets</h3>
              <p className="text-sm text-muted-foreground">
                Allow AI to create maintenance tickets from chat
              </p>
            </div>
            <Switch id="auto-tickets" checked={true} onCheckedChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'email', name: 'Email', description: 'Receive notifications via email' },
            { id: 'push', name: 'Push', description: 'Browser push notifications' },
            { id: 'in-app', name: 'In-App', description: 'Notifications within the app' },
          ].map((notification) => (
            <div key={notification.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{notification.name}</h3>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
              </div>
              <Switch
                id={notification.id}
                checked={notification.id !== 'push'}
                onCheckedChange={() => {}}
                disabled={notification.id === 'push'}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}