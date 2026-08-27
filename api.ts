import { supabase } from '@/lib/supabase';
import type { GeminiRequest, GeminiResponse, SearchResponse } from '@/lib/types';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function searchJobOffers(params: {
  keywords?: string;
  commune?: string;
  codePostal?: string;
  distance?: number;
  contractType?: string;
  excludeInterim?: boolean;
  excludeTraining?: boolean;
}): Promise<SearchResponse> {
  const response = await fetch(`${FUNCTIONS_URL}/france-travail-jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erreur de recherche (${response.status})`);
  }

  const data = await response.json() as SearchResponse;
  if (!data.offers) throw new Error('Réponse invalide de l\'API.');
  return data;
}

export async function getJobOfferDetail(offerId: string) {
  const response = await fetch(`${FUNCTIONS_URL}/france-travail-jobs/offer/${offerId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erreur (${response.status})`);
  }

  return response.json();
}

export async function callGemini(request: GeminiRequest): Promise<string> {
  const response = await fetch(`${FUNCTIONS_URL}/gemini-cv-optimizer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erreur Gemini (${response.status})`);
  }

  const data = await response.json() as GeminiResponse;
  if (!data.result) throw new Error('Réponse vide de l\'IA.');
  return data.result;
}

export async function saveCVToDatabase(params: {
  fileName?: string;
  rawText?: string;
  formData?: unknown;
  optimizedText?: string;
  targetOfferId?: string;
}) {
  const { error } = await supabase.from('user_cvs').insert({
    file_name: params.fileName,
    raw_text: params.rawText,
    form_data: params.formData,
    optimized_text: params.optimizedText,
    target_offer_id: params.targetOfferId,
  });

  if (error) throw new Error(error.message);
}

export async function getUserCVs() {
  const { data, error } = await supabase
    .from('user_cvs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
