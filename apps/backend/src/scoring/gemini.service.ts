import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      this.logger.warn('GEMINI_API_KEY not set — AI scoring disabled, using base score only');
    }
  }

  async analyzeLead(prompt: string): Promise<string | null> {
    if (!this.model) return null;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      this.logger.error('Gemini API error', (err as Error).message);
      return null;
    }
  }

  get isEnabled(): boolean {
    return this.model !== null;
  }
}
