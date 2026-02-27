import { UUID } from './common';

export interface SignOff {
  [key: string]: unknown;
}

export interface SignOffEntry {
  id: UUID;
  [key: string]: unknown;
}
