import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ChatResponseOutput } from './schemas';

const DEFAULT_MODEL = 'gpt-4o';

interface GenerateStructuredInput<TSchema extends z.ZodTypeAny> {
  prompt: string;
  schema: TSchema;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Generates structured JSON output using AI SDK's generateObject
 * This follows NestFlow's pattern of validated AI outputs
 */
export async function generateStructuredJson<TSchema extends z.ZodTypeAny>({
  prompt,
  schema,
  model = DEFAULT_MODEL,
  temperature = 0.2,
  maxTokens = 2000,
  systemPrompt,
}: GenerateStructuredInput<TSchema>): Promise<z.infer<TSchema>> {
  const result = await generateObject({
    model: openai(model),
    schema,
    prompt,
    system: systemPrompt,
    temperature,
    maxTokens,
  });

  return result.object;
}

/**
 * Generates a chat response with optional tool calls and action cards
 */
export async function generateChatResponse({
  messages,
  tools,
  systemPrompt,
  model = DEFAULT_MODEL,
  temperature = 0.3,
  maxTokens = 2000,
}: {
  messages: Array<{ role: string; content: string }>;
  tools?: any;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<ChatResponseOutput> {
  const result = await generateObject({
    model: openai(model),
    schema: z.object({
      message: z.string(),
      toolCalls: z.array(
        z.object({
          name: z.string(),
          arguments: z.record(z.unknown()),
        })
      ).optional(),
      actionCard: z.object({
        type: z.enum(['confirm_event', 'create_ticket', 'schedule_visit']),
        title: z.string(),
        description: z.string(),
        data: z.record(z.unknown()),
      }).optional(),
    }),
    prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
    system: systemPrompt,
    temperature,
    maxTokens,
  });

  return result.object;
}

/**
 * Checks if AI is configured (has API key)
 */
export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Gets the configured model name
 */
export function getModelName(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}