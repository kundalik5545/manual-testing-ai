'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav, type AppSection } from '@/components/layout/sidebar-nav';
import { ContentPanel } from '@/components/layout/content-panel';

const sections: AppSection[] = [
  { id: 'overview', label: 'Test Report Overview' },
  { id: 'objective', label: 'Test Objective' },
  { id: 'prerequisites', label: 'Test Prerequisites' },
  { id: 'test-data', label: 'Test Data' },
  { id: 'test-cases', label: 'Regression Test Cases' },
  { id: 'db-queries', label: 'Database Queries' },
  { id: 'checklist', label: 'Test Execution Checklist' },
  { id: 'known-issues', label: 'Known Issues & Notes' },
  { id: 'summary', label: 'Test Summary Template' },
  { id: 'defect-log', label: 'Defect Log' },
  { id: 'sign-off', label: 'Sign-Off' },
];

export function AppShell() {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = useMemo(
    () =>
      sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection],
  );

  const handleSelectSection = (sectionId: string) => {
    setActiveSection(sectionId);
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

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <SidebarNav
          sections={sections}
          activeSection={activeSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectSection={handleSelectSection}
        />

        <ContentPanel
          title={active.label}
          sectionId={active.id}
          description="Phase 3 upload pipeline is active in overview; remaining sections are ready for implementation."
        />
      </div>
    </div>
  );
}
