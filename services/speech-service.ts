import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { logger } from './logger';

export interface SpeakOptions {
  language?: 'ur' | 'en' | string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

class SpeechService {
  private isSpeaking = false;

  /**
   * Speak arbitrary text offline using the device's native speech synthesizer.
   * Supports Urdu ('ur-PK') and English ('en-US') with calm, clear farmer-friendly pacing.
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!text || text.trim() === '') {
      logger.warn('[SpeechService] Attempted to speak empty text.');
      return;
    }

    try {
      // Stop any current utterance first
      await this.stop();

      const isUrdu = options.language === 'ur' || options.language === 'ur-PK';
      // Language code: 'ur-PK' for Pakistani Urdu, 'en-US' for English
      const languageCode = isUrdu ? 'ur-PK' : 'en-US';

      // Pacing: slightly slower (0.85) for Urdu so farmers can comfortably digest agricultural terms
      const speechRate = options.rate ?? (isUrdu ? 0.85 : 0.90);
      const pitch = options.pitch ?? 1.0;

      this.isSpeaking = true;
      logger.info(`[SpeechService] Speaking (${languageCode}, rate: ${speechRate}): "${text.slice(0, 50)}..."`);

      Speech.speak(text.trim(), {
        language: languageCode,
        pitch,
        rate: speechRate,
        onDone: () => {
          this.isSpeaking = false;
          logger.debug('[SpeechService] Speech playback finished.');
          options.onDone?.();
        },
        onStopped: () => {
          this.isSpeaking = false;
          logger.debug('[SpeechService] Speech playback stopped.');
          options.onStopped?.();
        },
        onError: (err) => {
          this.isSpeaking = false;
          logger.warn('[SpeechService] Speech synthesis error:', err);
          // If 'ur-PK' failed on a device that only has generic 'ur', attempt fallback
          if (isUrdu && languageCode === 'ur-PK') {
            Speech.speak(text.trim(), {
              language: 'ur',
              pitch,
              rate: speechRate,
              onDone: options.onDone,
              onStopped: options.onStopped,
              onError: (fallbackErr) => {
                options.onError?.(new Error(String(fallbackErr)));
              },
            });
            return;
          }
          options.onError?.(new Error(String(err)));
        },
      });
    } catch (err: any) {
      this.isSpeaking = false;
      logger.error('[SpeechService] Exception during Speech.speak:', err);
      options.onError?.(err);
    }
  }

  /**
   * Stop any currently playing speech immediately.
   */
  async stop(): Promise<void> {
    try {
      this.isSpeaking = false;
      await Speech.stop();
    } catch (err) {
      logger.warn('[SpeechService] Error stopping speech:', err);
    }
  }

  /**
   * Check if speech is currently active.
   */
  async isActive(): Promise<boolean> {
    try {
      const active = await Speech.isSpeakingAsync();
      this.isSpeaking = active;
      return active;
    } catch {
      return this.isSpeaking;
    }
  }
}

export const speechService = new SpeechService();

