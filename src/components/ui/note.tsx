import * as React from 'react';
import { cn } from '@/lib/utils';

export function Note({ className, children }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Note;
