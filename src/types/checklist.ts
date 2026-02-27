import { UUID } from './common';

export interface ChecklistItem {
  id: UUID;
  checked: boolean;
  [key: string]: unknown;
}
