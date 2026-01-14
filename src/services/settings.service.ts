import { Injectable, signal, effect } from '@angular/core';

export type AiProvider = 'gemini' | 'openai' | 'openrouter' | 'claude' | 'mistral';

export interface ProviderConfig {
  id: AiProvider;
  name: string;
  defaultModel: string;
  baseUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly providers: ProviderConfig[] = [
    { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
    { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o' },
    { id: 'openrouter', name: 'OpenRouter', defaultModel: 'google/gemini-2.0-flash-001', baseUrl: 'https://openrouter.ai/api/v1' },
    { id: 'claude', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20240620' },
    { id: 'mistral', name: 'Mistral AI', defaultModel: 'mistral-large-latest', baseUrl: 'https://api.mistral.ai/v1' }
  ];

  activeProvider = signal<AiProvider>('gemini');
  isSettingsOpen = signal(false);
  
  // Store keys separately to avoid exposing them easily in state dumps
  private keys = signal<Record<string, string>>({});

  constructor() {
    this.loadSettings();
    
    // Auto-save effect
    effect(() => {
      localStorage.setItem('codemind_provider', this.activeProvider());
      localStorage.setItem('codemind_keys', JSON.stringify(this.keys()));
    });
  }

  private loadSettings() {
    const savedProvider = localStorage.getItem('codemind_provider') as AiProvider;
    const savedKeys = localStorage.getItem('codemind_keys');
    
    if (savedProvider && this.providers.some(p => p.id === savedProvider)) {
      this.activeProvider.set(savedProvider);
    }

    if (savedKeys) {
      try {
        this.keys.set(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Failed to parse saved keys');
      }
    }
  }

  getApiKey(provider: AiProvider): string {
    const key = this.keys()[provider];
    // Fallback for Gemini if environment variable is present (for demo purposes)
    if (!key && provider === 'gemini' && typeof process !== 'undefined' && process.env['API_KEY']) {
      return process.env['API_KEY'];
    }
    return key || '';
  }

  setApiKey(provider: AiProvider, key: string) {
    this.keys.update(k => ({ ...k, [provider]: key }));
  }

  toggleSettings() {
    this.isSettingsOpen.update(v => !v);
  }
}