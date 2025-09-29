import axios, { AxiosRequestConfig } from 'axios';

async function requestWithRetry(url: string, config: AxiosRequestConfig, maxRetries = 5) {
  let attempt = 0;
  let delay = 500;

  while (attempt < maxRetries) {
    try {
      const response = await axios(url, config);
      return response.data;
    } catch (error: any) {
      if (!error.response || error.response.status !== 429) {
        throw error;
      }
      attempt++;
      console.warn(`429 detected. Retry attempt ${attempt} in ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }

  throw new Error(`Request failed after ${maxRetries} retries due to 429`);
}

export async function generateAIResponse(prompt: string) {
  const url = process.env.VERTEX_AI_ENDPOINT;
  const requestBody = { prompt };

  return requestWithRetry(url, {
    method: 'POST',
    data: requestBody,
    headers: {
      Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}
