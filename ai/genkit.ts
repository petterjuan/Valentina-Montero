
import { genkit, type GenkitConfig } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const config: GenkitConfig = {
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
};

export const ai = genkit(config);
