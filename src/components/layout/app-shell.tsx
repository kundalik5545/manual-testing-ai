'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './app-header';
import { SidebarNav } from './sidebar-nav';
import { ContentPanel } from './content-panel';
import {
  appSections,
  type SectionId,
} from '@/components/layout/section-config';

const defaultSection = appSections[0];

function isValidSectionId(value: string): value is SectionId {
  return appSections.some((section) => section.id === value);
}

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SectionId>(
    defaultSection.id,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = useMemo(
    () =>
      appSections.find((section) => section.id === activeSection) ??
      defaultSection,
    [activeSection],
  );

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && isValidSectionId(hash)) {
      setActiveSection(hash);
    }

    const handleHashChange = () => {
      const next = window.location.hash.replace('#', '');
      if (next && isValidSectionId(next)) {
        setActiveSection(next);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
    setSidebarOpen(false);
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-50 m-2 rounded-md px-3 py-2 text-sm focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>

      <AppHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex min-h-0 flex-1">
        <SidebarNav
          sections={appSections}
          activeSection={activeSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectSection={(sectionId) => {
            if (isValidSectionId(sectionId)) {
              handleSelectSection(sectionId);
            }
          }}
        />

        <ContentPanel title={active.label} sectionId={active.id} />
      </div>
    </div>
  );
}
