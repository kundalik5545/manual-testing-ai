import { Badge } from '@/components/ui/badge';
import { SectionContent } from '@/components/report/section-content';
import type { SectionId } from '@/components/layout/section-config';

interface ContentPanelProps {
  title: string;
  sectionId: SectionId;
  description?: string;
}

export function ContentPanel({
  title,
  sectionId,
  description,
}: ContentPanelProps) {
  const isPlainSection = sectionId === 'db-queries';

  return (
    <main
      id="main-content"
      className="bg-muted/20 min-w-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4 sm:py-5 lg:px-6"
      tabIndex={-1}
    >
      <div className="mx-auto w-full max-w-360">
        <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
          <h1 className="text-lg font-semibold sm:text-2xl">{title}</h1>
          <Badge variant="info" size="md">
            Active Section
          </Badge>
        </div>

        <section
          key={sectionId}
          className={
            isPlainSection
              ? 'animate-in fade-in w-full duration-200'
              : 'bg-card animate-in fade-in w-full rounded-lg border p-3 shadow-xs duration-200 sm:p-5'
          }
          aria-labelledby="section-title"
        >
          <h2
            id="section-title"
            className="text-muted-foreground mb-2 text-sm font-medium"
          >
            Section ID: {sectionId}
          </h2>
          {description ? (
            <p className="text-muted-foreground mb-3 text-sm">{description}</p>
          ) : null}
          <SectionContent sectionId={sectionId} />
        </section>
      </div>
    </main>
  );
}
