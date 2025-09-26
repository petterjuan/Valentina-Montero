import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: [
        {
          name: 'gemini-pro',
          path: 'gemini-pro'
        }
      ]
    }),
  ],
  model: 'googleai/gemini-pro',
});
