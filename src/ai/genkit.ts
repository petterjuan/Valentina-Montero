
import { configureGenkit } from 'genkit/flow';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
