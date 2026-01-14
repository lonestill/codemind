import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface AiResponse {
  text: string;
  suggestedCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async analyzeCode(code: string, mode: 'explain' | 'optimize' | 'debug'): Promise<AiResponse> {
    const model = 'gemini-2.5-flash';
    
    if (mode === 'explain') {
      const prompt = `You are an expert software engineer. Explain the following code snippet clearly and concisely. Describe what it does, the logic used, and any important concepts. Use Markdown for formatting.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
      
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return { text: response.text };
      } catch (error) {
        console.error('Gemini API Error:', error);
        return { text: 'Error connecting to Gemini AI. Please check your API key or try again later.' };
      }
    } else {
      // Optimize or Debug mode - Request JSON with fixed code
      const prompt = mode === 'optimize' 
        ? `You are an expert software engineer. Analyze the following code for performance, readability, and best practices. Provide an improved version of the code and an explanation.`
        : `You are an expert QA engineer and developer. Scan the following code for bugs, security vulnerabilities, and logic errors. Provide a fixed version of the code and an explanation.`;

      const contents = `${prompt}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { 
                  type: Type.STRING, 
                  description: "Markdown explanation of what was changed and why." 
                },
                improvedCode: { 
                  type: Type.STRING, 
                  description: "The complete rewritten code snippet with changes applied." 
                }
              },
              required: ["explanation", "improvedCode"]
            }
          }
        });
        
        const json = JSON.parse(response.text);
        return { 
          text: json.explanation, 
          suggestedCode: json.improvedCode 
        };

      } catch (error) {
        console.error('Gemini API Error:', error);
        return { text: 'Error processing code with Gemini AI.' };
      }
    }
  }
}