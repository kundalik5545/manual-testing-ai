import { Badge } from '@/components/ui/badge';
import { ReportUpload } from '@/components/report/report-upload';

interface ContentPanelProps {
  title: string;
  sectionId: string;
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
      {sectionId === 'overview' ? <ReportUpload /> : null}

      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        <Badge variant="info" size="md">
          Active Section
        </Badge>
      </div>

      <section
        className="bg-card rounded-lg border p-4 sm:p-5"
        aria-labelledby="section-title"
      >
        <h2
          id="section-title"
          className="text-muted-foreground mb-2 text-sm font-medium"
        >
          Section ID: {sectionId}
        </h2>
        <p className="text-muted-foreground text-sm">
          {description ??
            'Section content will be implemented in the next phases.'}
        </p>
      </section>
    </main>
  );
}
