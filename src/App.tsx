import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { CreateLeadModal } from './components/common/CreateLeadModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { MyLeadsPage } from './pages/MyLeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { PipelinePage } from './pages/PipelinePage';
import { FollowupsPage } from './pages/FollowupsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { StudentsPage } from './pages/StudentsPage';
import { UniversitiesPage } from './pages/UniversitiesPage';
import { CoursesPage } from './pages/CoursesPage';
import { CounselorsPage } from './pages/CounselorsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useNotifications } from './context/NotificationContext';

export const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLeadCreated = (newLead: any) => {
    setCreateLeadOpen(false);
    addToast(`Lead ${newLead.student_name} created successfully!`, 'success');
    navigate(`/leads/${newLead.id}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCreateLead={() => setCreateLeadOpen(true)}
        />

        {/* Dynamic Page Routes */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/my-leads" element={<MyLeadsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/followups" element={<FollowupsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/universities" element={<UniversitiesPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/counselors" element={<CounselorsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CreateLeadModal
        isOpen={createLeadOpen}
        onClose={() => setCreateLeadOpen(false)}
        onLeadCreated={handleLeadCreated}
      />
    </div>
  );
};

export default App;
