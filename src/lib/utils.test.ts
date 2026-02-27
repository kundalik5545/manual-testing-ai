import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges classes and resolves tailwind conflicts', () => {
    const value = cn('px-2', 'px-4', 'font-bold');

    expect(value).toContain('px-4');
    expect(value).toContain('font-bold');
    expect(value).not.toContain('px-2');
  });
});
