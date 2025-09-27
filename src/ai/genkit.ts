
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Forzar el uso de la API de Vertex AI especificando el proyecto y la ubicación.
// Esto es crucial para asegurar que se utiliza el endpoint correcto que tiene
// los permisos adecuados, en lugar de la API de Generative Language.
const googleAiPlugin = googleAI({
  project: 'vm-fitness-hub',
  location: 'us-central1',
});

export const ai = genkit({
  plugins: [googleAiPlugin],
  logLevel: 'debug',
  enableTracing: true,
});
