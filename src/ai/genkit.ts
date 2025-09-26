import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: {
        pro: {
          model: 'gemini-pro',
        },
      },
    }),
  ],
  model: 'googleai/pro',
});
