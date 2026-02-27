export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type DefectStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Defect {
  bugId: string;
  testCaseId: string;
  title: string;
  description: string;
  severity: Severity;
  status: DefectStatus;
  dateFound: string;
  url?: string;
  actionsTaken?: string;
  createdAt: string;
  updatedAt: string;
}
