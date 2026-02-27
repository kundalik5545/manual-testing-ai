export type Status = 'Not Executed' | 'Passed' | 'Failed' | 'Blocked';

export interface TestCase {
  id: string;
  name: string;
  module: string;
  location: string;
  priority: string[];
  source: string[];
  status: Status;
  testSteps?: string[];
  expectedResult?: string;
  preconditions?: string;
  testData?: string;
  category?: string;
}
