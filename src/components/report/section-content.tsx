import { useEffect, useMemo, useState, type ClipboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, type Column } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ReportUpload } from '@/components/report/report-upload';
import { useReportStore } from '@/store/reportStore';
import { useDefectStore } from '@/store/defectStore';
import { compressImageBlobToDataUrl } from '@/lib/services/imageCompression';
import {
  exportReportAsExcel,
  exportReportAsHtml,
  exportReportAsPdf,
} from '@/lib/services/reportExportService';
import type { SectionId } from '@/components/layout/section-config';
import type { TestCase } from '@/types';
import type { Defect, DefectStatus, Severity } from '@/types/defect';

const statusOptions: TestCase['status'][] = [
  'Not Executed',
  'Passed',
  'Failed',
  'Blocked',
];

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
      {text}
    </p>
  );
}

function OverviewSection() {
  const reportData = useReportStore((state) => state.reportData);

  return (
    <div className="space-y-4">
      <ReportUpload />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Module</p>
          <p className="text-sm font-medium">
            {reportData?.moduleName ?? 'N/A'}
          </p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Version</p>
          <p className="text-sm font-medium">{reportData?.version ?? 'N/A'}</p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Environment</p>
          <p className="text-sm font-medium">
            {reportData?.testEnvironment ?? reportData?.environment ?? 'N/A'}
          </p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Last Updated</p>
          <p className="text-sm font-medium">
            {reportData?.lastUpdated ?? 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ObjectiveSection() {
  const reportData = useReportStore((state) => state.reportData);

  return (
    <div className="space-y-2 text-sm">
      <p>
        This report viewer supports structured regression execution for module:{' '}
        <span className="font-medium">{reportData?.moduleName ?? 'N/A'}</span>.
      </p>
      <p className="text-muted-foreground">
        Use this workspace to manage test execution status, defects,
        screenshots, and final sign-off with consistent report formatting.
      </p>
    </div>
  );
}

function PrerequisitesSection() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      <li>Upload a valid main report JSON file.</li>
      <li>Include linked test cases/scenarios files when referenced.</li>
      <li>Confirm target environment access before execution.</li>
      <li>Ensure baseline test data is available for verification.</li>
    </ul>
  );
}

function TestDataSection() {
  const testCases = useReportStore((state) => state.testCases);

  return (
    <div className="space-y-3 text-sm">
      <p>
        Loaded test cases:{' '}
        <span className="font-medium">{testCases.length}</span>
      </p>
      {testCases.length ? (
        <p className="text-muted-foreground">
          Test data is available through uploaded report-linked resources.
        </p>
      ) : (
        <EmptyState text="Upload report files in Overview to populate test data." />
      )}
    </div>
  );
}

function TestCasesSection() {
  const testCases = useReportStore((state) => state.testCases);
  const screenshotsByTestCase = useReportStore(
    (state) => state.screenshotsByTestCase,
  );
  const updateTestCase = useReportStore((state) => state.updateTestCase);
  const addScreenshot = useReportStore((state) => state.addScreenshot);
  const deleteScreenshot = useReportStore((state) => state.deleteScreenshot);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
    null,
  );
  const [previewState, setPreviewState] = useState<{
    testCaseId: string;
    screenshotIndex: number;
  } | null>(null);
  const [actualResultDraft, setActualResultDraft] = useState('');
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  const selectedTestCase = useMemo(
    () => testCases.find((testCase) => testCase.id === selectedTestCaseId),
    [selectedTestCaseId, testCases],
  );

  const openDetailsModal = (testCase: TestCase) => {
    setSelectedTestCaseId(testCase.id);
    setActualResultDraft(testCase.actualResult ?? '');
  };

  const closeDetailsModal = () => {
    setSelectedTestCaseId(null);
    setActualResultDraft('');
    setScreenshotError(null);
  };

  const handleOpenScreenshotPreview = (
    testCaseId: string,
    screenshotIndex: number,
  ) => {
    setPreviewState({ testCaseId, screenshotIndex });
  };

  const handleCloseScreenshotPreview = () => {
    setPreviewState(null);
  };

  const handleDeleteScreenshot = async (
    testCaseId: string,
    screenshotIndex: number,
  ) => {
    await deleteScreenshot(testCaseId, screenshotIndex);
    setPreviewState((current) =>
      current?.testCaseId === testCaseId ? null : current,
    );
  };

  const currentPreviewScreenshots = previewState
    ? (screenshotsByTestCase[previewState.testCaseId] ?? [])
    : [];

  const currentPreviewImage = previewState
    ? (currentPreviewScreenshots[previewState.screenshotIndex] ?? null)
    : null;

  const handleNextPreviewScreenshot = () => {
    setPreviewState((current) => {
      if (!current) {
        return null;
      }

      const screenshots = screenshotsByTestCase[current.testCaseId] ?? [];
      if (!screenshots.length) {
        return null;
      }

      return {
        testCaseId: current.testCaseId,
        screenshotIndex: (current.screenshotIndex + 1) % screenshots.length,
      };
    });
  };

  const handlePasteFromClipboard = async (testCaseId: string) => {
    setScreenshotError(null);

    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setScreenshotError(
          'Clipboard image read is not supported in this browser context.',
        );
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      const imageItem = clipboardItems.find((item) =>
        item.types.some((type) => type.startsWith('image/')),
      );

      if (!imageItem) {
        setScreenshotError('Clipboard does not contain an image.');
        return;
      }

      const imageType = imageItem.types.find((type) =>
        type.startsWith('image/'),
      );
      if (!imageType) {
        setScreenshotError('Unsupported clipboard image format.');
        return;
      }

      const blob = await imageItem.getType(imageType);
      const compressedImage = await compressImageBlobToDataUrl(blob);
      await addScreenshot(testCaseId, compressedImage);
    } catch {
      setScreenshotError(
        'Unable to paste screenshot. Allow clipboard permissions and try again.',
      );
    }
  };

  const handlePasteEvent = async (
    event: ClipboardEvent<HTMLDivElement>,
    testCaseId: string,
  ) => {
    const imageFile = Array.from(event.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();

    if (!imageFile) {
      return;
    }

    event.preventDefault();
    setScreenshotError(null);

    try {
      const compressedImage = await compressImageBlobToDataUrl(imageFile);
      await addScreenshot(testCaseId, compressedImage);
    } catch {
      setScreenshotError('Unable to process pasted image. Please try again.');
    }
  };

  const handleSaveActualResult = async () => {
    if (!selectedTestCase) {
      return;
    }

    await updateTestCase(selectedTestCase.id, {
      actualResult: actualResultDraft.trim(),
    });
    closeDetailsModal();
  };

  const columns: Column<TestCase>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'module', header: 'Module', sortable: true },
    { key: 'location', header: 'Location', sortable: true },
    {
      key: 'priority',
      header: 'Priority',
      render: (value) => (Array.isArray(value) ? value.join(', ') : ''),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value, row) => (
        <select
          className="border-input bg-background h-8 rounded-md border px-2 text-xs"
          value={String(value)}
          onChange={(event) => {
            const nextStatus = event.target.value as TestCase['status'];
            void updateTestCase(row.id, { status: nextStatus });
          }}
        >
          {statusOptions.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actualResult',
      header: 'Actual Result',
      render: (value) => {
        if (!value) {
          return (
            <Badge size="sm" variant="neutral">
              Not Added
            </Badge>
          );
        }

        return (
          <span className="text-muted-foreground block max-w-56 truncate text-xs">
            {String(value)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => openDetailsModal(row)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void handlePasteFromClipboard(row.id)}
          >
            Paste
          </Button>
        </div>
      ),
    },
    {
      key: 'screenshots',
      header: 'Screenshots',
      render: (_, row) => {
        const screenshots = screenshotsByTestCase[row.id] ?? [];

        if (!screenshots.length) {
          return (
            <span className="text-muted-foreground text-xs">No Preview</span>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            {screenshots.slice(0, 2).map((image, index) => (
              <div
                key={`${row.id}-shot-${index}`}
                className="group relative h-11 w-14 shrink-0"
              >
                <button
                  type="button"
                  className="h-full w-full overflow-hidden rounded-md border"
                  onClick={() => handleOpenScreenshotPreview(row.id, index)}
                  aria-label={`Preview screenshot ${index + 1} for ${row.id}`}
                >
                  <img
                    src={image}
                    alt={`Screenshot ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  className="bg-destructive text-primary-foreground absolute -top-1 -right-1 hidden size-5 items-center justify-center rounded-full text-xs group-hover:flex"
                  onClick={() => void handleDeleteScreenshot(row.id, index)}
                  aria-label={`Delete screenshot ${index + 1} for ${row.id}`}
                >
                  ×
                </button>
              </div>
            ))}
            {screenshots.length > 2 ? (
              <Badge size="sm" variant="neutral">
                +{screenshots.length - 2}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
  ];

  if (!testCases.length) {
    return <EmptyState text="No test cases loaded yet." />;
  }

  return (
    <>
      <Table columns={columns} data={testCases} />

      <Modal
        isOpen={Boolean(selectedTestCase)}
        onClose={closeDetailsModal}
        title={
          selectedTestCase
            ? `Test Case Details: ${selectedTestCase.id}`
            : 'Test Case Details'
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDetailsModal}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveActualResult()}>
              Save
            </Button>
          </div>
        }
      >
        {selectedTestCase ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{selectedTestCase.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Module</p>
                <p className="font-medium">{selectedTestCase.module}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">{selectedTestCase.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="font-medium">{selectedTestCase.status}</p>
              </div>
            </div>

            <div>
              <label
                htmlFor="actual-result"
                className="text-muted-foreground mb-1 block text-xs"
              >
                Actual Result
              </label>
              <textarea
                id="actual-result"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                value={actualResultDraft}
                onChange={(event) => setActualResultDraft(event.target.value)}
                placeholder="Enter observed outcome for this test case..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Screenshot Capture
              </p>
              <div
                className="border-input bg-background text-muted-foreground rounded-md border border-dashed p-3 text-xs"
                tabIndex={0}
                onPaste={(event) =>
                  handlePasteEvent(event, selectedTestCase.id)
                }
              >
                Click here and press Ctrl+V to paste screenshot directly from
                clipboard.
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  void handlePasteFromClipboard(selectedTestCase.id)
                }
              >
                Paste Screenshot
              </Button>
              {screenshotError ? (
                <p className="text-destructive text-xs">{screenshotError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Screenshot Gallery (
                {(screenshotsByTestCase[selectedTestCase.id] ?? []).length})
              </p>
              {(screenshotsByTestCase[selectedTestCase.id] ?? []).length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(screenshotsByTestCase[selectedTestCase.id] ?? []).map(
                    (image, index) => (
                      <div
                        key={`${selectedTestCase.id}-${index}`}
                        className="space-y-2"
                      >
                        <img
                          src={image}
                          alt={`Screenshot ${index + 1} for ${selectedTestCase.id}`}
                          className="h-24 w-full rounded-md border object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          onClick={() =>
                            void deleteScreenshot(selectedTestCase.id, index)
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <EmptyState text="No screenshots captured for this test case yet." />
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(currentPreviewImage)}
        onClose={handleCloseScreenshotPreview}
        title="Screenshot Preview"
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseScreenshotPreview}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNextPreviewScreenshot}
              disabled={currentPreviewScreenshots.length < 2}
            >
              Next Screenshot
            </Button>
          </div>
        }
      >
        {currentPreviewImage ? (
          <div className="space-y-3">
            <img
              src={currentPreviewImage}
              alt="Selected screenshot preview"
              className="max-h-[65vh] w-full rounded-md border object-contain"
            />
            <p className="text-muted-foreground text-xs">
              Screenshot {((previewState?.screenshotIndex ?? 0) + 1).toString()}{' '}
              of {currentPreviewScreenshots.length.toString()}
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function DatabaseQueriesSection() {
  const databaseQueries = useReportStore(
    (state) => state.reportData?.databaseQueries,
  );

  if (!databaseQueries?.length) {
    return (
      <EmptyState text="No database queries available in uploaded report." />
    );
  }

  return (
    <div className="space-y-3">
      {databaseQueries.map((query) => (
        <article key={query.queryId} className="rounded-md border p-3">
          <p className="text-sm font-medium">{query.queryId}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {query.description}
          </p>
          <pre className="bg-muted mt-3 overflow-x-auto rounded-md border p-3 text-xs whitespace-pre-wrap">
            {query.sqlScript}
          </pre>
        </article>
      ))}
    </div>
  );
}

function ExecutionChecklistSection() {
  const executionChecklist = useReportStore(
    (state) => state.reportData?.executionChecklist,
  );

  if (!executionChecklist?.length) {
    return <EmptyState text="No execution checklist found in report data." />;
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {executionChecklist.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function KnownIssuesSection() {
  const knownIssues = useReportStore((state) => state.reportData?.knownIssues);

  if (!knownIssues?.length) {
    return <EmptyState text="No known issues found in report data." />;
  }

  return (
    <div className="space-y-3">
      {knownIssues.map((issue) => (
        <article key={issue.title} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{issue.title}</p>
          <p className="text-muted-foreground mt-1">{issue.description}</p>
          {issue.workaround ? (
            <p className="mt-2">
              <span className="font-medium">Workaround:</span>{' '}
              {issue.workaround}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SummarySection() {
  const reportData = useReportStore((state) => state.reportData);
  const testCases = useReportStore((state) => state.testCases);
  const defects = useDefectStore((state) => state.defects);
  const initialized = useDefectStore((state) => state.initialized);
  const loadDefects = useDefectStore((state) => state.loadDefects);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string>('');
  const [validatedFormats, setValidatedFormats] = useState<
    Record<'html' | 'pdf' | 'excel', boolean>
  >({ html: false, pdf: false, excel: false });

  useEffect(() => {
    if (!initialized) {
      void loadDefects();
    }
  }, [initialized, loadDefects]);

  const defectList = useMemo(() => Object.values(defects), [defects]);

  const handleExport = async (format: 'html' | 'pdf' | 'excel') => {
    setIsExporting(true);
    setExportError(null);

    try {
      if (!reportData) {
        throw new Error('Load report data before exporting.');
      }

      const payload = {
        reportData,
        testCases,
        defects: defectList,
      };

      if (format === 'html') {
        const fileName = exportReportAsHtml(payload);
        setLastExport(fileName);
        setValidatedFormats((current) => ({ ...current, html: true }));
      }

      if (format === 'pdf') {
        const fileName = await exportReportAsPdf(payload);
        setLastExport(fileName);
        setValidatedFormats((current) => ({ ...current, pdf: true }));
      }

      if (format === 'excel') {
        const fileName = await exportReportAsExcel(payload);
        setLastExport(fileName);
        setValidatedFormats((current) => ({ ...current, excel: true }));
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const runValidation = async () => {
    await handleExport('html');
    await handleExport('pdf');
    await handleExport('excel');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Test Cases</p>
          <p className="text-sm font-medium">{testCases.length}</p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Defects</p>
          <p className="text-sm font-medium">{defectList.length}</p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Passed</p>
          <p className="text-sm font-medium">
            {
              testCases.filter((testCase) => testCase.status === 'Passed')
                .length
            }
          </p>
        </div>
        <div className="bg-card rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Failed</p>
          <p className="text-sm font-medium">
            {
              testCases.filter((testCase) => testCase.status === 'Failed')
                .length
            }
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isExporting}
          onClick={() => void handleExport('html')}
        >
          Export HTML
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isExporting}
          onClick={() => void handleExport('pdf')}
        >
          Export PDF
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isExporting}
          onClick={() => void handleExport('excel')}
        >
          Export Excel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isExporting}
          onClick={() => void runValidation()}
        >
          Validate All Formats
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={validatedFormats.html ? 'success' : 'neutral'}>
          HTML {validatedFormats.html ? 'validated' : 'pending'}
        </Badge>
        <Badge variant={validatedFormats.pdf ? 'success' : 'neutral'}>
          PDF {validatedFormats.pdf ? 'validated' : 'pending'}
        </Badge>
        <Badge variant={validatedFormats.excel ? 'success' : 'neutral'}>
          Excel {validatedFormats.excel ? 'validated' : 'pending'}
        </Badge>
      </div>

      {lastExport ? (
        <p className="text-muted-foreground text-sm">
          Last export completed: {lastExport}
        </p>
      ) : null}
      {exportError ? (
        <p className="text-destructive text-sm">{exportError}</p>
      ) : null}
    </div>
  );
}

function DefectLogSection() {
  const testCases = useReportStore((state) => state.testCases);
  const defects = useDefectStore((state) => state.defects);
  const initialized = useDefectStore((state) => state.initialized);
  const loadDefects = useDefectStore((state) => state.loadDefects);
  const addDefect = useDefectStore((state) => state.addDefect);
  const updateDefect = useDefectStore((state) => state.updateDefect);
  const deleteDefect = useDefectStore((state) => state.deleteDefect);

  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | DefectStatus>('All');
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    bugId: '',
    testCaseId: '',
    title: '',
    description: '',
    severity: 'Medium' as Severity,
    status: 'Open' as DefectStatus,
    dateFound: new Date().toISOString().slice(0, 10),
    url: '',
    actionsTaken: '',
  });

  useEffect(() => {
    if (!initialized) {
      void loadDefects();
    }
  }, [initialized, loadDefects]);

  const defectList = useMemo(
    () =>
      Object.values(defects).sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
    [defects],
  );

  const filteredDefects = useMemo(
    () =>
      defectList.filter((defect) => {
        const matchesSeverity =
          severityFilter === 'All' || defect.severity === severityFilter;
        const matchesStatus =
          statusFilter === 'All' || defect.status === statusFilter;
        return matchesSeverity && matchesStatus;
      }),
    [defectList, severityFilter, statusFilter],
  );

  const nextBugId = useMemo(() => {
    const numericSuffixes = defectList
      .map((defect) => Number.parseInt(defect.bugId.replace(/\D+/g, ''), 10))
      .filter((value) => !Number.isNaN(value));

    const next =
      (numericSuffixes.length ? Math.max(...numericSuffixes) : 0) + 1;
    return `BUG-${String(next).padStart(3, '0')}`;
  }, [defectList]);

  const openCreateModal = () => {
    setEditingDefectId(null);
    setForm({
      bugId: nextBugId,
      testCaseId: testCases[0]?.id ?? '',
      title: '',
      description: '',
      severity: 'Medium',
      status: 'Open',
      dateFound: new Date().toISOString().slice(0, 10),
      url: '',
      actionsTaken: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (defect: Defect) => {
    setEditingDefectId(defect.bugId);
    setForm({
      bugId: defect.bugId,
      testCaseId: defect.testCaseId,
      title: defect.title,
      description: defect.description,
      severity: defect.severity,
      status: defect.status,
      dateFound: defect.dateFound,
      url: defect.url ?? '',
      actionsTaken: defect.actionsTaken ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDefectId(null);
  };

  const handleSubmitDefect = async () => {
    const nowIso = new Date().toISOString();

    if (editingDefectId) {
      await updateDefect(editingDefectId, {
        testCaseId: form.testCaseId,
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        status: form.status,
        dateFound: form.dateFound,
        url: form.url.trim() || undefined,
        actionsTaken: form.actionsTaken.trim() || undefined,
      });
      closeModal();
      return;
    }

    const newDefect: Defect = {
      bugId: form.bugId,
      testCaseId: form.testCaseId,
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      status: form.status,
      dateFound: form.dateFound,
      url: form.url.trim() || undefined,
      actionsTaken: form.actionsTaken.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await addDefect(newDefect);
    closeModal();
  };

  const defectColumns: Column<Defect>[] = [
    { key: 'bugId', header: 'Bug ID', sortable: true },
    { key: 'testCaseId', header: 'Test Case', sortable: true },
    { key: 'title', header: 'Title', sortable: true },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (value) => (
        <Badge
          size="sm"
          variant={
            value === 'Critical'
              ? 'danger'
              : value === 'High'
                ? 'warning'
                : value === 'Medium'
                  ? 'info'
                  : 'neutral'
          }
        >
          {String(value)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge size="sm" variant="neutral">
          {String(value)}
        </Badge>
      ),
    },
    { key: 'dateFound', header: 'Date Found', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => openEditModal(row)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={() => void deleteDefect(row.bugId)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={openCreateModal}>
          Add Defect
        </Button>

        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={severityFilter}
          onChange={(event) =>
            setSeverityFilter(event.target.value as 'All' | Severity)
          }
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as 'All' | DefectStatus)
          }
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {filteredDefects.length ? (
        <Table columns={defectColumns} data={filteredDefects} />
      ) : (
        <EmptyState text="No defects match the current filter criteria." />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDefectId ? `Edit Defect ${form.bugId}` : 'Add Defect'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmitDefect()}
              disabled={
                !form.bugId ||
                !form.testCaseId ||
                !form.title ||
                !form.description
              }
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-bug-id"
            >
              Bug ID
            </label>
            <input
              id="defect-bug-id"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.bugId}
              disabled={Boolean(editingDefectId)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bugId: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-date-found"
            >
              Date Found
            </label>
            <input
              id="defect-date-found"
              type="date"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.dateFound}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dateFound: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-test-case"
            >
              Test Case
            </label>
            <select
              id="defect-test-case"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.testCaseId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  testCaseId: event.target.value,
                }))
              }
            >
              <option value="">Select test case</option>
              {testCases.map((testCase) => (
                <option key={testCase.id} value={testCase.id}>
                  {testCase.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-severity"
            >
              Severity
            </label>
            <select
              id="defect-severity"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.severity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  severity: event.target.value as Severity,
                }))
              }
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-title"
            >
              Title
            </label>
            <input
              id="defect-title"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-description"
            >
              Description
            </label>
            <textarea
              id="defect-description"
              className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-status"
            >
              Status
            </label>
            <select
              id="defect-status"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as DefectStatus,
                }))
              }
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-url"
            >
              URL
            </label>
            <input
              id="defect-url"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({ ...current, url: event.target.value }))
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="text-muted-foreground mb-1 block text-xs"
              htmlFor="defect-actions"
            >
              Actions Taken
            </label>
            <textarea
              id="defect-actions"
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              value={form.actionsTaken}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  actionsTaken: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SignOffSection() {
  return (
    <EmptyState text="Sign-off workflow will be implemented in a dedicated phase." />
  );
}

export function SectionContent({ sectionId }: { sectionId: SectionId }) {
  switch (sectionId) {
    case 'overview':
      return <OverviewSection />;
    case 'objective':
      return <ObjectiveSection />;
    case 'prerequisites':
      return <PrerequisitesSection />;
    case 'test-data':
      return <TestDataSection />;
    case 'test-cases':
      return <TestCasesSection />;
    case 'db-queries':
      return <DatabaseQueriesSection />;
    case 'checklist':
      return <ExecutionChecklistSection />;
    case 'known-issues':
      return <KnownIssuesSection />;
    case 'summary':
      return <SummarySection />;
    case 'defect-log':
      return <DefectLogSection />;
    case 'sign-off':
      return <SignOffSection />;
    default:
      return <EmptyState text="Section content is unavailable." />;
  }
}
