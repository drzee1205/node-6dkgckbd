import { supabase } from './supabase';
import { generateResponse, createMedicalSystemPrompt, type MistralMessage } from './mistral';
import { Citation, PediatricReference } from '../types';

// HuggingFace embedding service
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function generateEmbedding(text: string): Promise<number[]> {
  if (!HUGGINGFACE_API_KEY) {
    console.warn('HuggingFace API key not found, using mock embeddings');
    return new Array(384).fill(0).map(() => Math.random());
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    const embeddings = await response.json();
    return Array.isArray(embeddings) ? embeddings : embeddings[0];
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return new Array(384).fill(0).map(() => Math.random());
  }
}

export async function searchMedicalKnowledge(
  query: string,
  limit: number = 5
): Promise<PediatricReference[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search Supabase for similar content using cosine similarity
    const { data, error } = await supabase.rpc('search_medical_content', {
      query_embedding: queryEmbedding,
      match_count: limit,
      similarity_threshold: 0.7
    });

    if (error) {
      console.error('Supabase search error:', error);
      return [];
    }

    return data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      chapter: item.chapter,
      page: item.page,
      tags: item.tags || [],
      lastUpdated: new Date(item.updated_at)
    })) || [];
  } catch (error) {
    console.error('Medical knowledge search failed:', error);
    return [];
  }
}

export async function generateMedicalResponse(
  userQuery: string,
  conversationHistory: MistralMessage[] = []
): Promise<{ response: string; citations: Citation[] }> {
  try {
    // Search for relevant medical content
    const relevantContent = await searchMedicalKnowledge(userQuery);
    
    // Create citations from retrieved content
    const citations: Citation[] = relevantContent.map(ref => ({
      source: `Nelson Textbook of Pediatrics, ${ref.chapter}`,
      page: ref.page,
      chapter: ref.chapter,
      relevance: 0.8 // This would be calculated from similarity score
    }));

    // Build context from retrieved content
    const context = relevantContent.length > 0 
      ? relevantContent.map(ref => 
          `**${ref.title}** (${ref.chapter}, p. ${ref.page}):\n${ref.content}`
        ).join('\n\n')
      : '';

    // Construct the prompt with context
    const systemPrompt = createMedicalSystemPrompt();
    const contextPrompt = context
      ? `\n\n**Retrieved Context from Nelson Textbook of Pediatrics:**\n${context}\n\n**User Question:** ${userQuery}`
      : `\n\n**User Question:** ${userQuery}`;

    const messages: MistralMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: contextPrompt }
    ];

    // Generate response using Mistral
    const response = await generateResponse(messages, 0.3, 2048);

    return {
      response,
      citations
    };
  } catch (error) {
    console.error('Medical response generation failed:', error);
    return {
      response: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
      citations: []
    };
  }
}

// Drug dosage calculator
export function calculatePediatricDosage({
  drugName,
  dosePerKg,
  patientWeight,
  maxDose,
  frequency
}: {
  drugName: string;
  dosePerKg: number;
  patientWeight: number;
  maxDose?: number;
  frequency: string;
}): string {
  const calculatedDose = dosePerKg * patientWeight;
  const finalDose = maxDose ? Math.min(calculatedDose, maxDose) : calculatedDose;
  
  return `**${drugName} Dosage Calculation:**\n\n` +
    `- Patient weight: ${patientWeight} kg\n` +
    `- Dose per kg: ${dosePerKg} mg/kg\n` +
    `- Calculated dose: ${calculatedDose.toFixed(1)} mg\n` +
    `${maxDose ? `- Maximum dose: ${maxDose} mg\n` : ''}` +
    `- **Recommended dose: ${finalDose.toFixed(1)} mg ${frequency}**\n\n` +
    `*Always verify dosing with current guidelines and consider patient-specific factors.*`;
}