'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReportStore } from '@/store/reportStore';

export function ReportUpload() {
  const {
    reportData,
    testCases,
    isLoading,
    loadReport,
    clearReport,
    loadWarnings,
    loadError,
    loadedResources,
  } = useReportStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      await loadReport([acceptedFiles[0]]);
    },
    [loadReport],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'application/json': ['.json'],
    },
  });

  return (
    <section
      className="bg-card mb-4 rounded-lg border p-4 sm:p-5"
      aria-labelledby="upload-title"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="upload-title" className="text-base font-semibold sm:text-lg">
          Upload Test Report Data
        </h2>
        {reportData ? (
          <Button variant="outline" size="sm" onClick={clearReport}>
            Clear
          </Button>
        ) : null}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-md border border-dashed px-4 py-6 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:bg-accent/50',
        )}
      >
        <input {...getInputProps()} aria-label="Upload report files" />
        <Upload
          className="text-muted-foreground mx-auto mb-2 size-5"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">Upload main report JSON file</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Upload one main JSON file. Linked files are auto-fetched from the same
          folder level.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm">Loading and validating files...</p>
      ) : null}

      {loadError ? (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {loadError}
        </p>
      ) : null}

      {loadWarnings.length ? (
        <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
          {loadWarnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      {reportData ? (
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Module:</span> {reportData.moduleName}
          </p>
          <p>
            <span className="font-medium">Version:</span> {reportData.version}
          </p>
          <p>
            <span className="font-medium">Loaded Test Cases:</span>{' '}
            {testCases.length}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {loadedResources.map((resource) => (
              <Badge key={resource} variant="neutral" size="sm">
                {resource}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
