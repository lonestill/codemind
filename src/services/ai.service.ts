import { Injectable, inject } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { SettingsService, AiProvider } from './settings.service';

export interface AiResponse {
  text: string;
  suggestedCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private settings = inject(SettingsService);

  async detectLanguage(code: string): Promise<string> {
    const prompt = `Analyze the following code snippet and identify the programming language. 
    Return ONLY the language identifier (e.g., 'typescript', 'python', 'html', 'sql'). 
    Do not add punctuation or explanation. If unknown, return 'plaintext'.
    
    Code:
    ${code.slice(0, 500)}`; // Limit context for detection

    const response = await this.generateText(prompt, 'You are a code classifier.');
    const lang = response.trim().toLowerCase().split('\n')[0].replace(/[^a-z]/g, '');
    return lang || 'plaintext';
  }

  async analyzeCode(code: string, mode: 'explain' | 'optimize' | 'debug'): Promise<AiResponse> {
    const provider = this.settings.activeProvider();
    
    if (mode === 'explain') {
      const prompt = `You are an expert software engineer. Explain the following code snippet clearly and concisely. Describe what it does, the logic used, and any important concepts. Use Markdown for formatting.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
      const text = await this.generateText(prompt);
      return { text };
    } else {
      // Optimize or Debug - Structured Output
      const task = mode === 'optimize' 
        ? "Analyze for performance, readability, and best practices." 
        : "Scan for bugs, security vulnerabilities, and logic errors.";
        
      const prompt = `You are an expert software engineer. ${task}
      
      Return a JSON object with two keys:
      1. "explanation": A Markdown explanation of changes.
      2. "improvedCode": The complete rewritten code snippet.
      
      Code:
      \`\`\`
      ${code}
      \`\`\``;

      // Gemini has native JSON schema support, others need prompting
      if (provider === 'gemini') {
        return this.callGeminiStructured(prompt, code);
      } else {
        return this.callGenericStructured(prompt);
      }
    }
  }

  async completeCode(beforeCursor: string, afterCursor: string, language: string): Promise<string> {
    const prompt = `Complete the following code. The cursor is currently between the 'Before Cursor' and 'After Cursor' blocks.
    Return ONLY the code to be inserted at the cursor position. Do not wrap in markdown blocks. Do not repeat code from before or after.
    
    Language: ${language}
    
    Code Before Cursor:
    \`\`\`
    ${beforeCursor.slice(-1000)}
    \`\`\`
    
    Code After Cursor:
    \`\`\`
    ${afterCursor.slice(0, 1000)}
    \`\`\``;

    const response = await this.generateText(prompt, 'You are a code auto-completion engine. Return only the code to insert.');
    
    // Cleanup potential markdown if the model hallucinates it despite instructions
    let clean = response.trim();
    if (clean.startsWith('```')) {
       clean = clean.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
    }
    return clean;
  }

  // --- Internal Implementation Methods ---

  private async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const provider = this.settings.activeProvider();
    const key = this.settings.getApiKey(provider);

    if (!key) throw new Error(`API Key for ${provider} is missing. Please configure it in settings.`);

    switch (provider) {
      case 'gemini': return this.callGeminiText(prompt, key, systemInstruction);
      case 'claude': return this.callClaude(prompt, key, systemInstruction);
      case 'openai':
      case 'openrouter':
      case 'mistral':
        return this.callOpenAICompatible(prompt, key, provider, systemInstruction);
      default: return 'Provider not implemented';
    }
  }

  // --- Gemini Specifics ---

  private async callGeminiText(prompt: string, key: string, system?: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: key });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: system ? { systemInstruction: system } : undefined
      });
      return response.text || '';
    } catch (e: any) {
      return `Gemini Error: ${e.message}`;
    }
  }

  private async callGeminiStructured(prompt: string, originalCode: string): Promise<AiResponse> {
    const key = this.settings.getApiKey('gemini');
    if (!key) return { text: 'Missing API Key' };

    const ai = new GoogleGenAI({ apiKey: key });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              improvedCode: { type: Type.STRING }
            },
            required: ["explanation", "improvedCode"]
          }
        }
      });
      const json = JSON.parse(response.text);
      return { text: json.explanation, suggestedCode: json.improvedCode };
    } catch (e: any) {
      return { text: `Gemini Error: ${e.message}` };
    }
  }

  // --- OpenAI / OpenRouter / Mistral Compatible ---

  private async callOpenAICompatible(prompt: string, key: string, provider: AiProvider, system?: string): Promise<string> {
    const config = this.settings.providers.find(p => p.id === provider)!;
    const url = config.baseUrl 
      ? `${config.baseUrl}/chat/completions` 
      : 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          // OpenRouter specific headers
          ...(provider === 'openrouter' ? { 'HTTP-Referer': window.location.origin } : {})
        },
        body: JSON.stringify({
          model: config.defaultModel,
          messages: messages,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || res.statusText);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      return `${config.name} Error: ${e.message}`;
    }
  }

  // --- Claude (Anthropic) ---

  private async callClaude(prompt: string, key: string, system?: string): Promise<string> {
    try {
      // Note: Direct browser calls to Anthropic often fail due to CORS. 
      // This expects a CORS-enabled endpoint or proxy, or local dev setup.
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' // Only for demo/prototyping
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4096,
          system: system,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || res.statusText);
      }

      const data = await res.json();
      return data.content?.[0]?.text || '';
    } catch (e: any) {
      return `Claude Error: ${e.message}. Note: Anthropic API may require a proxy for CORS.`;
    }
  }

  // --- Generic Structured Output Helper (JSON Mode workaround) ---

  private async callGenericStructured(prompt: string): Promise<AiResponse> {
    // Append JSON instruction specifically for non-schema APIs
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond strictly with valid JSON only. No markdown fences.`;
    const text = await this.generateText(jsonPrompt, "You are a JSON generator.");
    
    try {
      // Clean up markdown fences if model ignored instruction
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(clean);
      return { 
        text: json.explanation || 'No explanation provided.', 
        suggestedCode: json.improvedCode || '' 
      };
    } catch (e) {
      return { text: `Failed to parse AI response as JSON.\n\nRaw response:\n${text}` };
    }
  }
}