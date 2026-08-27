import { FormEvent, useState } from 'react';
import { ArrowRight, Briefcase, FileText, GraduationCap, Loader2, Plus, Sparkles, Trash2, Upload, X, CheckCircle2, Wand2, Target } from 'lucide-react';
import { callGemini, saveCVToDatabase } from '@/lib/api';
import type { CVFormData, CVExperience, CVEducation } from '@/lib/types';

type CVMode = 'upload' | 'form';

export function CVBuilder() {
  const [mode, setMode] = useState<CVMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [action, setAction] = useState<'analyze_cv' | 'create_cv' | 'adapt_cv'>('create_cv');

  // Upload state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CVFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    targetRole: '',
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    summary: '',
  });

  // Temp inputs for arrays
  const [newSkill, setNewSkill] = useState('');
  const [newExp, setNewExp] = useState<CVExperience>({ company: '', position: '', startDate: '', endDate: '', description: '' });
  const [newEdu, setNewEdu] = useState<CVEducation>({ diploma: '', school: '', year: '', details: '' });

  // Adapt CV state
  const [adaptOfferTitle, setAdaptOfferTitle] = useState('');
  const [adaptOfferCompany, setAdaptOfferCompany] = useState('');
  const [adaptOfferDesc, setAdaptOfferDesc] = useState('');

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileText(ev.target?.result as string);
    };
    reader.readAsText(file);
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
    setNewSkill('');
  }

  function removeSkill(idx: number) {
    setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== idx) });
  }

  function addExperience() {
    if (!newExp.company || !newExp.position) return;
    setFormData({ ...formData, experiences: [...formData.experiences, newExp] });
    setNewExp({ company: '', position: '', startDate: '', endDate: '', description: '' });
  }

  function removeExperience(idx: number) {
    setFormData({ ...formData, experiences: formData.experiences.filter((_, i) => i !== idx) });
  }

  function addEducation() {
    if (!newEdu.diploma || !newEdu.school) return;
    setFormData({ ...formData, educations: [...formData.educations, newEdu] });
    setNewEdu({ diploma: '', school: '', year: '', details: '' });
  }

  function removeEducation(idx: number) {
    setFormData({ ...formData, educations: formData.educations.filter((_, i) => i !== idx) });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (action === 'adapt_cv') {
        if (!adaptOfferTitle.trim() || !adaptOfferDesc.trim()) {
          setError('Indique le titre et la description de l\'offre pour adapter ton CV.');
          setLoading(false);
          return;
        }
        const resultText = await callGemini({
          action: 'adapt_cv',
          cvText: mode === 'upload' ? fileText : undefined,
          formData: mode === 'form' ? formData : undefined,
          jobOffer: {
            title: adaptOfferTitle,
            company: adaptOfferCompany,
            description: adaptOfferDesc,
          },
        });
        setResult(resultText);
        await saveCVToDatabase({
          fileName: fileName ?? undefined,
          rawText: mode === 'upload' ? fileText : undefined,
          formData: mode === 'form' ? formData : undefined,
          optimizedText: resultText,
        });
      } else if (action === 'analyze_cv') {
        if (mode === 'upload' && !fileText) {
          setError('Téléverse d\'abord ton CV.');
          setLoading(false);
          return;
        }
        if (mode === 'form' && !formData.fullName) {
          setError('Remplis au moins ton nom pour analyser ton CV.');
          setLoading(false);
          return;
        }
        const resultText = await callGemini({
          action: 'analyze_cv',
          cvText: mode === 'upload' ? fileText : undefined,
          formData: mode === 'form' ? formData : undefined,
        });
        setResult(resultText);
      } else {
        // create_cv
        if (mode === 'form' && !formData.fullName) {
          setError('Remplis au moins ton nom pour créer ton CV.');
          setLoading(false);
          return;
        }
        const resultText = await callGemini({
          action: 'create_cv',
          formData: mode === 'form' ? formData : undefined,
          cvText: mode === 'upload' ? fileText : undefined,
        });
        setResult(resultText);
        await saveCVToDatabase({
          fileName: fileName ?? undefined,
          rawText: mode === 'upload' ? fileText : undefined,
          formData: mode === 'form' ? formData : undefined,
          optimizedText: resultText,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  if (!mode) {
    return (
      <div className="cv-builder">
        <div className="board-header">
          <h1>Mon CV</h1>
          <p>Crée ou améliore ton CV avec l'IA, puis adapte-le à chaque offre.</p>
        </div>
        <div className="cv-mode-grid">
          <button className="cv-mode-card" type="button" onClick={() => setMode('upload')}>
            <div className="cv-mode-icon"><Upload size={32} /></div>
            <h3>Téléverser mon CV</h3>
            <p>Dépose ton CV existant. L'IA l'analyse et te propose des améliorations concrètes.</p>
            <span className="cv-mode-action">Choisir <ArrowRight size={16} /></span>
          </button>
          <button className="cv-mode-card" type="button" onClick={() => setMode('form')}>
            <div className="cv-mode-icon"><FileText size={32} /></div>
            <h3>Créer mon CV</h3>
            <p>Remplis tes expériences, formations et compétences. L'IA crée un CV professionnel structuré.</p>
            <span className="cv-mode-action">Choisir <ArrowRight size={16} /></span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-builder">
      <div className="board-header">
        <div className="cv-back-row">
          <h1>{mode === 'upload' ? 'Téléverser mon CV' : 'Créer mon CV'}</h1>
          <button className="cv-back-btn" type="button" onClick={() => { setMode(null); setResult(null); setError(null); }}>
            <X size={16} /> Changer de mode
          </button>
        </div>
      </div>

      <div className="cv-action-tabs">
        <button className={action === 'create_cv' ? 'cv-action-tab active' : 'cv-action-tab'} type="button" onClick={() => setAction('create_cv')}>
          <Wand2 size={16} /> Créer / Améliorer
        </button>
        <button className={action === 'analyze_cv' ? 'cv-action-tab active' : 'cv-action-tab'} type="button" onClick={() => setAction('analyze_cv')}>
          <Sparkles size={16} /> Analyser
        </button>
        <button className={action === 'adapt_cv' ? 'cv-action-tab active' : 'cv-action-tab'} type="button" onClick={() => setAction('adapt_cv')}>
          <Target size={16} /> Adapter à une offre
        </button>
      </div>

      <form className="cv-form" onSubmit={handleSubmit}>
        {mode === 'upload' && (
          <div className="cv-upload-zone">
            <label className="upload-label" htmlFor="cv-file">
              <Upload size={28} />
              <span>{fileName ? fileName : 'Clique pour sélectionner ton CV'}</span>
              <small>Fichier texte (.txt, .md)</small>
            </label>
            <input id="cv-file" type="file" accept=".txt,.md,.text" onChange={handleFileUpload} />
          </div>
        )}

        {mode === 'form' && (
          <div className="cv-form-fields">
            <div className="cv-form-row">
              <div className="cv-field">
                <label>Nom complet *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Jean Dupont" required />
              </div>
              <div className="cv-field">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean@email.fr" />
              </div>
            </div>

            <div className="cv-form-row">
              <div className="cv-field">
                <label>Téléphone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
              </div>
              <div className="cv-field">
                <label>Ville</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Paris" />
              </div>
            </div>

            <div className="cv-field">
              <label>Poste recherché</label>
              <input type="text" value={formData.targetRole} onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })} placeholder="Développeur web, chargé de comm..." />
            </div>

            <div className="cv-field">
              <label>Résumé professionnel</label>
              <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} rows={3} placeholder="Décris en 2-3 lignes ton profil et tes objectifs..." />
            </div>

            {/* Experiences */}
            <div className="cv-section-block">
              <h4><Briefcase size={17} /> Expériences professionnelles</h4>
              {formData.experiences.map((exp, idx) => (
                <div key={idx} className="cv-item-row">
                  <div>
                    <strong>{exp.position}</strong> chez {exp.company}
                    <small>{exp.startDate} — {exp.endDate || 'aujourd\'hui'}</small>
                  </div>
                  <button type="button" onClick={() => removeExperience(idx)}><Trash2 size={15} /></button>
                </div>
              ))}
              <div className="cv-add-form">
                <input type="text" placeholder="Poste" value={newExp.position} onChange={(e) => setNewExp({ ...newExp, position: e.target.value })} />
                <input type="text" placeholder="Entreprise" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} />
                <input type="text" placeholder="Début (MM/AAAA)" value={newExp.startDate} onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })} />
                <input type="text" placeholder="Fin (ou vide)" value={newExp.endDate} onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })} />
                <textarea placeholder="Description des missions..." value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} rows={2} />
                <button type="button" className="cv-add-btn" onClick={addExperience}><Plus size={15} /> Ajouter</button>
              </div>
            </div>

            {/* Education */}
            <div className="cv-section-block">
              <h4><GraduationCap size={17} /> Formation</h4>
              {formData.educations.map((edu, idx) => (
                <div key={idx} className="cv-item-row">
                  <div>
                    <strong>{edu.diploma}</strong> — {edu.school}
                    <small>{edu.year}</small>
                  </div>
                  <button type="button" onClick={() => removeEducation(idx)}><Trash2 size={15} /></button>
                </div>
              ))}
              <div className="cv-add-form">
                <input type="text" placeholder="Diplôme" value={newEdu.diploma} onChange={(e) => setNewEdu({ ...newEdu, diploma: e.target.value })} />
                <input type="text" placeholder="Établissement" value={newEdu.school} onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })} />
                <input type="text" placeholder="Année" value={newEdu.year} onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })} />
                <button type="button" className="cv-add-btn" onClick={addEducation}><Plus size={15} /> Ajouter</button>
              </div>
            </div>

            {/* Skills */}
            <div className="cv-section-block">
              <h4>Compétences</h4>
              <div className="cv-skills-list">
                {formData.skills.map((skill, idx) => (
                  <span key={idx} className="cv-skill-chip">{skill} <button type="button" onClick={() => removeSkill(idx)}><X size={12} /></button></span>
                ))}
              </div>
              <div className="cv-skill-input">
                <input type="text" placeholder="Ajouter une compétence..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                <button type="button" className="cv-add-btn" onClick={addSkill}><Plus size={15} /></button>
              </div>
            </div>
          </div>
        )}

        {action === 'adapt_cv' && (
          <div className="cv-adapt-section">
            <h4><Target size={17} /> Offre d'emploi ciblée</h4>
            <p className="cv-adapt-hint">Colle les infos de l'offre pour laquelle tu veux adapter ton CV.</p>
            <div className="cv-field">
              <label>Titre du poste *</label>
              <input type="text" value={adaptOfferTitle} onChange={(e) => setAdaptOfferTitle(e.target.value)} placeholder="Développeur React" />
            </div>
            <div className="cv-field">
              <label>Entreprise</label>
              <input type="text" value={adaptOfferCompany} onChange={(e) => setAdaptOfferCompany(e.target.value)} placeholder="Nom de l'entreprise" />
            </div>
            <div className="cv-field">
              <label>Description de l'offre *</label>
              <textarea value={adaptOfferDesc} onChange={(e) => setAdaptOfferDesc(e.target.value)} rows={6} placeholder="Colle la description de l'offre ici..." />
            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="button button-primary cv-submit-btn" type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : (
            <>
              {action === 'create_cv' && <><Wand2 size={18} /> Générer mon CV</>}
              {action === 'analyze_cv' && <><Sparkles size={18} /> Analyser mon CV</>}
              {action === 'adapt_cv' && <><Target size={18} /> Adapter mon CV</>}
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="cv-result">
          <div className="cv-result-header">
            <CheckCircle2 size={22} />
            <strong>Résultat de l'IA</strong>
          </div>
          <pre className="cv-result-content">{result}</pre>
        </div>
      )}
    </div>
  );
}
