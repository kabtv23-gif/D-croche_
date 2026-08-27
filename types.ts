export interface JobOffer {
  external_id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  location: string | null;
  contract_type: string | null;
  description: string;
  salary: string | null;
  application_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_name: string | null;
  experience: string | null;
  duree_travail: string | null;
  alternance: boolean;
  accesHandicap: boolean;
  numero_offre: string | null;
  competences: string[];
  formations: string[];
  permis: string[];
  date_creation: string | null;
  keywords: string[];
  city: string | null;
}

export interface JobOfferDetail extends JobOffer {
  company_description: string | null;
  code_postal: string | null;
  salary_comment: string | null;
  qualites: string[];
  langues: Array<{ libelle: string; niveau: string }>;
  entreprise_url: string | null;
  entreprise_adaptee: boolean;
}

export interface SearchResponse {
  total: number;
  offers: JobOffer[];
  cached: boolean;
}

export interface CVExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CVEducation {
  diploma: string;
  school: string;
  year?: string;
  details?: string;
}

export interface CVFormData {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  targetRole?: string;
  experiences: CVExperience[];
  educations: CVEducation[];
  skills: string[];
  languages?: Array<{ name: string; level: string }>;
  summary?: string;
}

export type GeminiAction = 'analyze_cv' | 'create_cv' | 'adapt_cv';

export interface GeminiRequest {
  action: GeminiAction;
  cvText?: string;
  formData?: CVFormData;
  jobOffer?: {
    title: string;
    company: string;
    description: string;
    contract_type?: string;
    location?: string;
    competences?: string[];
  };
}

export interface GeminiResponse {
  result: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  target_role: string | null;
  experience_years: number | null;
  skills: string[] | null;
}
