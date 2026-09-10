import { streamOpenAI } from './openai.js';
import { streamAnthropic } from './anthropic.js';
import { streamMock } from './mock.js';

const env = process.env;

/**
 * Provider catalogue. A provider is "configured" when it can be used right now
 * (has a key, or doesn't need one). Unconfigured providers are still listed so the
 * UI can explain what to set.
 */
export const PROVIDERS = [
  {
    id: 'mock',
    label: 'Mock (offline)',
    kind: 'mock',
    configured: true,
    requires: null,
    models: ['mock-1'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    kind: 'openai',
    configured: Boolean(env.OPENAI_API_KEY),
    requires: 'OPENAI_API_KEY',
    baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: env.OPENAI_API_KEY,
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    kind: 'anthropic',
    configured: Boolean(env.ANTHROPIC_API_KEY),
    requires: 'ANTHROPIC_API_KEY',
    baseUrl: env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    apiKey: env.ANTHROPIC_API_KEY,
    models: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest', 'claude-sonnet-4-0'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'openai',
    configured: Boolean(env.OPENROUTER_API_KEY),
    requires: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    extraHeaders: { 'HTTP-Referer': 'http://localhost', 'X-Title': 'AI Chat Room' },
    models: [
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-haiku',
      'google/gemini-flash-1.5',
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-small',
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama / local',
    kind: 'openai',
    configured: true,
    requires: null,
    baseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKey: env.OLLAMA_API_KEY || undefined,
    models: ['llama3.1', 'llama3.2', 'mistral', 'qwen2.5', 'gemma2'],
  },
];

const byId = new Map(PROVIDERS.map((p) => [p.id, p]));

export function getProvider(id) {
  return byId.get(id);
}

/** Public, key-free view for the client. */
export function listProviders() {
  return PROVIDERS.map(({ id, label, kind, configured, requires, models, baseUrl }) => ({
    id,
    label,
    kind,
    configured,
    requires,
    models,
    baseUrl: kind === 'mock' ? undefined : baseUrl,
  }));
}

/**
 * Unified streaming entry point.
 * @param {object} p
 * @param {string} p.providerId
 * @param {string} p.model
 * @param {string} p.system
 * @param {Array<{role:'user'|'assistant', content:string}>} p.messages
 * @param {object} p.meta   { agentName, topic } — used by the mock provider
 * @returns {AsyncGenerator<string>}
 */
export function streamCompletion({ providerId, model, system, messages, temperature, maxTokens, signal, meta = {} }) {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider "${providerId}"`);

  switch (provider.kind) {
    case 'mock':
      return streamMock({ system, messages, signal, ...meta });

    case 'anthropic':
      return streamAnthropic({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model,
        system,
        messages,
        temperature,
        maxTokens,
        signal,
      });

    case 'openai':
      if (provider.requires && !provider.apiKey) {
        throw new Error(`${provider.label} is not configured: set ${provider.requires}`);
      }
      return streamOpenAI({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature,
        maxTokens,
        signal,
        extraHeaders: provider.extraHeaders,
      });

    default:
      throw new Error(`Unsupported provider kind "${provider.kind}"`);
  }
}
