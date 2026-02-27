import { PanelLeftClose } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AppSection {
  id: string;
  label: string;
}

interface SidebarNavProps {
  sections: readonly AppSection[];
  activeSection: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: string) => void;
}

export function SidebarNav({
  sections,
  activeSection,
  isOpen,
  onClose,
  onSelectSection,
}: SidebarNavProps) {
  const handleArrowNavigation = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (index + direction + sections.length) % sections.length;
    onSelectSection(sections[nextIndex].id);
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="bg-foreground/30 fixed inset-0 z-30 md:hidden"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={cn(
          'bg-card fixed inset-y-0 left-0 z-40 mt-14 flex w-64 flex-col border-r transition-transform sm:mt-16 md:sticky md:top-16 md:mt-0 md:h-[calc(100vh-4rem)] md:shrink-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Report sections"
      >
        <div className="flex justify-end px-2 py-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <nav
          className="overflow-y-auto px-2 pb-2 md:pt-2"
          aria-label="Section navigation"
        >
          <ul className="space-y-1">
            {sections.map((section, index) => {
              const isActive = section.id === activeSection;

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                    onClick={() => onSelectSection(section.id)}
                    onKeyDown={(event) => handleArrowNavigation(event, index)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
