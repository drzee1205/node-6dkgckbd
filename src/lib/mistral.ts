import { Mistral } from '@mistralai/mistralai';

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

if (!apiKey) {
  throw new Error('Missing Mistral API key');
}

export const mistral = new Mistral({
  apiKey: apiKey,
});

export interface MistralMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateResponse(
  messages: MistralMessage[],
  temperature: number = 0.3,
  maxTokens: number = 2048
): Promise<string> {
  try {
    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: messages,
      temperature,
      maxTokens,
      safePrompt: false,
    });

    const content = response.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('Mistral API error:', error);
    throw new Error('Failed to generate response from Mistral API');
  }
}

export function createMedicalSystemPrompt(): string {
  return `You are NelsonGPT, an evidence-based pediatric medical assistant powered by the Nelson Textbook of Pediatrics. You provide accurate, clinical-grade medical information for healthcare professionals.

Guidelines:
- Always cite sources when referencing medical information
- Provide dosage calculations with clear formulas
- Include differential diagnoses when relevant
- Mention contraindications and side effects
- Emphasize when immediate medical attention is needed
- Use clear, professional medical terminology
- Format responses with proper markdown for readability

Remember: You are assisting qualified healthcare professionals. Always recommend clinical correlation and professional judgment.`;
}