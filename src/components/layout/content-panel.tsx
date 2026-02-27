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
  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6"
      tabIndex={-1}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        <Badge variant="info" size="md">
          Active Section
        </Badge>
      </div>

      <section
        key={sectionId}
        className="bg-card animate-in fade-in rounded-lg border p-4 duration-200 sm:p-5"
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
    </main>
  );
}
