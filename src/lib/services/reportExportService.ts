import type { Defect, ReportData, TestCase } from '@/types';

interface ExportPayload {
  reportData: ReportData;
  testCases: TestCase[];
  defects: Defect[];
  exportedAt: string;
}

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function triggerDownload(blob: Blob, fileName: string): void {
  if (!blob.size) {
    throw new Error('Generated export file is empty.');
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function validatePayload(
  payload: Partial<ExportPayload>,
): asserts payload is ExportPayload {
  if (!payload.reportData) {
    throw new Error('Load a report before exporting.');
  }

  if (!payload.testCases || !Array.isArray(payload.testCases)) {
    throw new Error('Test cases are unavailable for export.');
  }

  if (!payload.defects || !Array.isArray(payload.defects)) {
    throw new Error('Defects are unavailable for export.');
  }
}

function buildSummaryTableRows(payload: ExportPayload): string {
  const total = payload.testCases.length;
  const passed = payload.testCases.filter(
    (testCase) => testCase.status === 'Passed',
  ).length;
  const failed = payload.testCases.filter(
    (testCase) => testCase.status === 'Failed',
  ).length;
  const blocked = payload.testCases.filter(
    (testCase) => testCase.status === 'Blocked',
  ).length;
  const notExecuted = payload.testCases.filter(
    (testCase) => testCase.status === 'Not Executed',
  ).length;
  const executed = passed + failed + blocked;
  const passRate = executed
    ? `${((passed / executed) * 100).toFixed(1)}%`
    : '0%';

  return `
    <tr><td>Total Test Cases</td><td>${total}</td></tr>
    <tr><td>Passed</td><td>${passed}</td></tr>
    <tr><td>Failed</td><td>${failed}</td></tr>
    <tr><td>Blocked</td><td>${blocked}</td></tr>
    <tr><td>Not Executed</td><td>${notExecuted}</td></tr>
    <tr><td>Pass Rate (Executed)</td><td>${passRate}</td></tr>
    <tr><td>Total Defects</td><td>${payload.defects.length}</td></tr>
  `;
}

export function exportReportAsHtml(
  payloadInput: Partial<ExportPayload>,
): string {
  validatePayload(payloadInput);
  const payload: ExportPayload = {
    ...payloadInput,
    exportedAt: payloadInput.exportedAt ?? new Date().toISOString(),
  };

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${payload.reportData.moduleName} - Export</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1, h2 { margin: 0 0 12px; }
      section { margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
      th { background: #f3f4f6; }
      .meta { margin: 0 0 6px; font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>${payload.reportData.moduleName}</h1>
    <p class="meta">Version: ${payload.reportData.version}</p>
    <p class="meta">Environment: ${payload.reportData.testEnvironment ?? payload.reportData.environment}</p>
    <p class="meta">Exported At: ${payload.exportedAt}</p>

    <section>
      <h2>Summary</h2>
      <table>
        <tbody>
          ${buildSummaryTableRows(payload)}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Test Cases</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Module</th><th>Location</th><th>Status</th><th>Actual Result</th>
          </tr>
        </thead>
        <tbody>
          ${payload.testCases
            .map(
              (testCase) =>
                `<tr><td>${testCase.id}</td><td>${testCase.name}</td><td>${testCase.module}</td><td>${testCase.location}</td><td>${testCase.status}</td><td>${testCase.actualResult ?? ''}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Defects</h2>
      <table>
        <thead>
          <tr>
            <th>Bug ID</th><th>Test Case</th><th>Title</th><th>Severity</th><th>Status</th><th>Date Found</th>
          </tr>
        </thead>
        <tbody>
          ${payload.defects
            .map(
              (defect) =>
                `<tr><td>${defect.bugId}</td><td>${defect.testCaseId}</td><td>${defect.title}</td><td>${defect.severity}</td><td>${defect.status}</td><td>${defect.dateFound}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  </body>
</html>`;

  const fileName = `${safeFileName(payload.reportData.moduleName)}-report-export.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, fileName);
  return fileName;
}

export async function exportReportAsPdf(
  payloadInput: Partial<ExportPayload>,
): Promise<string> {
  validatePayload(payloadInput);
  const payload: ExportPayload = {
    ...payloadInput,
    exportedAt: payloadInput.exportedAt ?? new Date().toISOString(),
  };

  const { jsPDF } = await import('jspdf');
  const document = new jsPDF({ unit: 'pt', format: 'a4' });

  const passed = payload.testCases.filter(
    (testCase) => testCase.status === 'Passed',
  ).length;
  const failed = payload.testCases.filter(
    (testCase) => testCase.status === 'Failed',
  ).length;
  const blocked = payload.testCases.filter(
    (testCase) => testCase.status === 'Blocked',
  ).length;
  const notExecuted = payload.testCases.filter(
    (testCase) => testCase.status === 'Not Executed',
  ).length;
  const executed = passed + failed + blocked;
  const passRate = executed
    ? `${((passed / executed) * 100).toFixed(1)}%`
    : '0%';

  let y = 40;
  const lineHeight = 18;

  const writeLine = (text: string, spacing = lineHeight) => {
    if (y > 780) {
      document.addPage();
      y = 40;
    }
    document.text(text, 40, y);
    y += spacing;
  };

  document.setFontSize(16);
  writeLine(payload.reportData.moduleName, 24);
  document.setFontSize(11);
  writeLine(`Version: ${payload.reportData.version}`);
  writeLine(
    `Environment: ${payload.reportData.testEnvironment ?? payload.reportData.environment}`,
  );
  writeLine(`Exported At: ${payload.exportedAt}`);
  writeLine('');

  writeLine(`Total Test Cases: ${payload.testCases.length}`);
  writeLine(`Passed: ${passed}`);
  writeLine(`Failed: ${failed}`);
  writeLine(`Blocked: ${blocked}`);
  writeLine(`Not Executed: ${notExecuted}`);
  writeLine(`Pass Rate (Executed): ${passRate}`);
  writeLine(`Total Defects: ${payload.defects.length}`);
  writeLine('');

  writeLine('Test Cases:', 22);
  payload.testCases.forEach((testCase) => {
    writeLine(`${testCase.id} | ${testCase.status} | ${testCase.name}`);
  });

  writeLine('');
  writeLine('Defects:', 22);
  payload.defects.forEach((defect) => {
    writeLine(
      `${defect.bugId} | ${defect.severity} | ${defect.status} | ${defect.title}`,
    );
  });

  const fileName = `${safeFileName(payload.reportData.moduleName)}-report-export.pdf`;
  document.save(fileName);
  return fileName;
}

export async function exportReportAsExcel(
  payloadInput: Partial<ExportPayload>,
): Promise<string> {
  validatePayload(payloadInput);
  const payload: ExportPayload = {
    ...payloadInput,
    exportedAt: payloadInput.exportedAt ?? new Date().toISOString(),
  };

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  const passed = payload.testCases.filter(
    (testCase) => testCase.status === 'Passed',
  ).length;
  const failed = payload.testCases.filter(
    (testCase) => testCase.status === 'Failed',
  ).length;
  const blocked = payload.testCases.filter(
    (testCase) => testCase.status === 'Blocked',
  ).length;
  const notExecuted = payload.testCases.filter(
    (testCase) => testCase.status === 'Not Executed',
  ).length;
  const executed = passed + failed + blocked;
  const passRate = executed
    ? `${((passed / executed) * 100).toFixed(1)}%`
    : '0%';

  const summaryRows = [
    { Metric: 'Module', Value: payload.reportData.moduleName },
    { Metric: 'Version', Value: payload.reportData.version },
    {
      Metric: 'Environment',
      Value:
        payload.reportData.testEnvironment ?? payload.reportData.environment,
    },
    { Metric: 'Exported At', Value: payload.exportedAt },
    { Metric: 'Total Test Cases', Value: payload.testCases.length },
    { Metric: 'Passed', Value: passed },
    { Metric: 'Failed', Value: failed },
    { Metric: 'Blocked', Value: blocked },
    { Metric: 'Not Executed', Value: notExecuted },
    { Metric: 'Pass Rate (Executed)', Value: passRate },
    { Metric: 'Total Defects', Value: payload.defects.length },
  ];

  const testCaseRows = payload.testCases.map((testCase) => ({
    TestCaseId: testCase.id,
    Name: testCase.name,
    Module: testCase.module,
    Location: testCase.location,
    Status: testCase.status,
    ActualResult: testCase.actualResult ?? '',
  }));

  const defectRows = payload.defects.map((defect) => ({
    BugId: defect.bugId,
    TestCaseId: defect.testCaseId,
    Title: defect.title,
    Severity: defect.severity,
    Status: defect.status,
    DateFound: defect.dateFound,
    Url: defect.url ?? '',
    ActionsTaken: defect.actionsTaken ?? '',
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    'Summary',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(testCaseRows),
    'TestCases',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(defectRows),
    'Defects',
  );

  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fileName = `${safeFileName(payload.reportData.moduleName)}-report-export.xlsx`;
  triggerDownload(blob, fileName);
  return fileName;
}
