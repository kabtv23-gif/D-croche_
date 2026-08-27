import { useState } from 'react';
import { Briefcase, FileText, LogOut, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { JobBoard } from '@/components/JobBoard';
import { CVBuilder } from '@/components/CVBuilder';

type DashboardTab = 'jobs' | 'cv';

export function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('jobs');

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark"><Compass size={18} strokeWidth={2.5} /></span>
          <span>Décroche</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'jobs' ? 'sidebar-item active' : 'sidebar-item'}
            type="button"
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={19} /> Offres d'emploi
          </button>
          <button
            className={activeTab === 'cv' ? 'sidebar-item active' : 'sidebar-item'}
            type="button"
            onClick={() => setActiveTab('cv')}
          >
            <FileText size={19} /> Mon CV
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="account-avatar">{initials}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
          <button className="sidebar-item logout" type="button" onClick={onSignOut}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'jobs' && <JobBoard onGoToCV={() => setActiveTab('cv')} />}
        {activeTab === 'cv' && <CVBuilder />}
      </main>
    </div>
  );
}
