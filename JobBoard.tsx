import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Briefcase, Building2, Clock3, Loader2, MapPin, Phone, Mail, ExternalLink, Search, Filter, X, CheckCircle2, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { searchJobOffers, getJobOfferDetail, callGemini, getUserCVs } from '@/lib/api';
import type { JobOffer } from '@/lib/types';

const DISTANCE_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

const CONTRACT_OPTIONS = [
  { value: '', label: 'Tous les contrats' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'ALT', label: 'Alternance' },
  { value: 'FRA', label: 'Stage' },
];

export function JobBoard({ onGoToCV }: { onGoToCV?: () => void } = {}) {
  const [keywords, setKeywords] = useState('');
  const [city, setCity] = useState('');
  const [distance, setDistance] = useState(30);
  const [contractType, setContractType] = useState('');
  const [excludeInterim, setExcludeInterim] = useState(true);
  const [excludeTraining, setExcludeTraining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [offerDetail, setOfferDetail] = useState<Record<string, unknown> | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [adaptedCV, setAdaptedCV] = useState<string | null>(null);
  const [savedCVText, setSavedCVText] = useState<string | null>(null);
  const [savedCVLoading, setSavedCVLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserCVs()
      .then((cvs) => {
        if (cancelled || !cvs || cvs.length === 0) return;
        const latest = cvs[0] as { optimized_text?: string; raw_text?: string };
        setSavedCVText(latest.optimized_text || latest.raw_text || null);
      })
      .catch(() => setSavedCVText(null))
      .finally(() => { if (!cancelled) setSavedCVLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!keywords.trim() && !city.trim()) {
      setError('Indique au moins un mot-clé ou une ville.');
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await searchJobOffers({
        keywords: keywords.trim() || undefined,
        commune: city.trim() || undefined,
        distance,
        contractType: contractType || undefined,
        excludeInterim,
        excludeTraining,
      });
      setOffers(result.offers);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  async function openOfferDetail(offer: JobOffer) {
    setSelectedOffer(offer);
    setOfferDetail(null);
    setAdaptedCV(null);
    setDetailLoading(true);
    try {
      const detail = await getJobOfferDetail(offer.external_id);
      setOfferDetail(detail);
    } catch {
      setOfferDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAdaptCV(offerOverride?: JobOffer) {
    const offer = offerOverride ?? selectedOffer;
    if (!offer) return;
    if (!savedCVText) {
      setError('Crée ton CV dans l\'onglet "Mon CV" avant de postuler avec l\'IA.');
      return;
    }
    setAdapting(true);
    setAdaptedCV(null);
    try {
      const result = await callGemini({
        action: 'adapt_cv',
        cvText: savedCVText,
        jobOffer: {
          title: offer.title,
          company: offer.company,
          description: offer.description,
          contract_type: offer.contract_type ?? undefined,
          location: offer.location ?? undefined,
          competences: offer.competences,
        },
      });
      setAdaptedCV(result);
    } catch (err) {
      setAdaptedCV(null);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'adaptation du CV.');
    } finally {
      setAdapting(false);
    }
  }

  async function handleApplyWithCV(offer: JobOffer) {
    await openOfferDetail(offer);
    handleAdaptCV(offer);
  }

  return (
    <div className="job-board">
      <div className="board-header">
        <h1>Offres d'emploi</h1>
        <p>De vraies offres d'entreprises, filtrées et mises à jour en temps réel.</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-inputs">
          <div className="search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Poste, mot-clé..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="search-field">
            <MapPin size={18} />
            <input
              type="text"
              placeholder="Ville ou code postal"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <button className="button button-primary search-btn" type="submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <><Search size={18} /> Rechercher</>}
          </button>
        </div>

        <div className="search-filters">
          <div className="filter-group">
            <Filter size={14} />
            <select value={distance} onChange={(e) => setDistance(Number(e.target.value))}>
              {DISTANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>Rayon {opt.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <Briefcase size={14} />
            <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
              {CONTRACT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <label className="filter-check">
            <input type="checkbox" checked={excludeInterim} onChange={(e) => setExcludeInterim(e.target.checked)} />
            <span>Exclure l'intérim</span>
          </label>
          <label className="filter-check">
            <input type="checkbox" checked={excludeTraining} onChange={(e) => setExcludeTraining(e.target.checked)} />
            <span>Exclure les organismes de formation</span>
          </label>
        </div>
      </form>

      {error && <div className="board-error">{error}</div>}

      {hasSearched && !loading && offers.length === 0 && !error && (
        <div className="board-empty">
          <FileText size={40} />
          <h3>Aucune offre trouvée</h3>
          <p>Essaie d'élargir ta recherche ou de modifier tes filtres.</p>
        </div>
      )}

      {hasSearched && !loading && offers.length > 0 && (
        <div className="results-info">{total} offre{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</div>
      )}

      <div className="offers-grid">
        {offers.map((offer) => (
          <article
            key={offer.external_id}
            className="offer-card"
            onClick={() => openOfferDetail(offer)}
          >
            <div className="offer-card-header">
              <div className="offer-company-logo">
                {offer.company.charAt(0).toUpperCase()}
              </div>
              <div className="offer-card-info">
                <h3>{offer.title}</h3>
                <span className="offer-company"><Building2 size={13} /> {offer.company}</span>
              </div>
            </div>
            <div className="offer-card-tags">
              {offer.location && <span><MapPin size={12} /> {offer.location}</span>}
              {offer.contract_type && <span><Briefcase size={12} /> {offer.contract_type}</span>}
              {offer.duree_travail && <span><Clock3 size={12} /> {offer.duree_travail}</span>}
            </div>
            <p className="offer-card-desc">{offer.description.slice(0, 160)}...</p>
            <div className="offer-card-footer">
              {offer.salary && <span className="offer-salary">{offer.salary}</span>}
              <button className="offer-view-btn" type="button">
                Voir l'offre <ArrowRight size={15} />
              </button>
            </div>
            <button
              className="button button-dark offer-apply-cv-btn"
              type="button"
              onClick={(e) => { e.stopPropagation(); handleApplyWithCV(offer); }}
              disabled={savedCVLoading}
            >
              <Sparkles size={15} /> Postuler avec mon CV
            </button>
          </article>
        ))}
      </div>

      {loading && (
        <div className="board-loading">
          <Loader2 size={32} className="spin" />
          <p>Recherche en cours...</p>
        </div>
      )}

      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          detail={offerDetail}
          detailLoading={detailLoading}
          onClose={() => { setSelectedOffer(null); setOfferDetail(null); setAdaptedCV(null); }}
          onAdaptCV={() => handleAdaptCV()}
          adapting={adapting}
          adaptedCV={adaptedCV}
          hasSavedCV={!!savedCVText}
          savedCVLoading={savedCVLoading}
          onGoToCV={onGoToCV}
        />
      )}
    </div>
  );
}

function OfferDetailModal({
  offer,
  detail,
  detailLoading,
  onClose,
  onAdaptCV,
  adapting,
  adaptedCV,
  hasSavedCV,
  savedCVLoading,
  onGoToCV,
}: {
  offer: JobOffer;
  detail: Record<string, unknown> | null;
  detailLoading: boolean;
  onClose: () => void;
  onAdaptCV: () => void;
  adapting: boolean;
  adaptedCV: string | null;
  hasSavedCV: boolean;
  savedCVLoading: boolean;
  onGoToCV?: () => void;
}) {
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="offer-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="offer-detail-header">
          <div className="offer-company-logo large">
            {offer.company.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{offer.title}</h2>
            <span className="offer-company"><Building2 size={15} /> {offer.company}</span>
          </div>
        </div>

        <div className="offer-detail-tags">
          {offer.location && <span><MapPin size={13} /> {offer.location}</span>}
          {offer.contract_type && <span><Briefcase size={13} /> {offer.contract_type}</span>}
          {offer.salary && <span>{offer.salary}</span>}
          {offer.experience && <span>{offer.experience}</span>}
        </div>

        {offer.contact_phone || offer.contact_email ? (
          <div className="offer-contact">
            <strong>Contacter l'entreprise</strong>
            {offer.contact_name && <span>{offer.contact_name}</span>}
            {offer.contact_phone && (
              <a href={`tel:${offer.contact_phone}`} className="contact-link">
                <Phone size={14} /> {offer.contact_phone}
              </a>
            )}
            {offer.contact_email && (
              <a href={`mailto:${offer.contact_email}`} className="contact-link">
                <Mail size={14} /> {offer.contact_email}
              </a>
            )}
          </div>
        ) : null}

        <div className="offer-detail-section">
          <h3>Description du poste</h3>
          <p className="offer-description-text">{offer.description}</p>
        </div>

        {offer.competences.length > 0 && (
          <div className="offer-detail-section">
            <h3>Compétences recherchées</h3>
            <div className="competence-tags">
              {offer.competences.map((c, i) => <span key={i}>{c}</span>)}
            </div>
          </div>
        )}

        <div className="offer-detail-actions">
          {offer.application_url && (
            <a
              href={offer.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
            >
              Postuler <ExternalLink size={17} />
            </a>
          )}
          <button
            className="button button-dark adapt-cv-btn"
            type="button"
            onClick={onAdaptCV}
            disabled={adapting || savedCVLoading || !hasSavedCV}
            title={!hasSavedCV ? 'Crée ton CV dans l\'onglet "Mon CV" pour utiliser cette fonction' : undefined}
          >
            {adapting ? <Loader2 size={18} className="spin" /> : <><Sparkles size={17} /> Analyser et adapter mon CV</>}
          </button>
        </div>

        {!savedCVLoading && !hasSavedCV && (
          <div className="board-error no-cv-warning">
            <AlertCircle size={16} />
            <span>Tu n'as pas encore de CV enregistré. </span>
            {onGoToCV ? (
              <button type="button" className="text-link" onClick={onGoToCV}>
                Crée-le dans l'onglet "Mon CV"
              </button>
            ) : (
              <span>Va dans l'onglet "Mon CV" pour en créer un.</span>
            )}
          </div>
        )}

        {adaptedCV && (
          <div className="adapted-cv-result">
            <div className="adapted-cv-header">
              <CheckCircle2 size={20} />
              <strong>Ce qu'il te manque + ton CV adapté à cette offre</strong>
            </div>
            <pre className="adapted-cv-content">{adaptedCV}</pre>
          </div>
        )}

        {detailLoading && (
          <div className="detail-loading">
            <Loader2 size={24} className="spin" />
            <p>Chargement des détails...</p>
          </div>
        )}
      </div>
    </div>
  );
}
