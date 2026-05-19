type NvidiaChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type NvidiaChatOptions = {
  messages: NvidiaChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
};

type NvidiaChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const NVIDIA_INVOKE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const NVIDIA_DEFAULT_MODEL = 'google/gemma-3n-e4b-it';

export async function runNvidiaChatCompletion({
  messages,
  model = NVIDIA_DEFAULT_MODEL,
  max_tokens = 512,
  temperature = 0.2,
  top_p = 0.7,
}: NvidiaChatOptions) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured.');
  }

  const response = await fetch(NVIDIA_INVOKE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
    }),
  });

  const data = (await response.json()) as NvidiaChatResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? `NVIDIA request failed with status ${response.status}`
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('NVIDIA returned an empty response.');
  }

  return content;
}