export const appSections = [
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
] as const;

export type SectionId = (typeof appSections)[number]['id'];
