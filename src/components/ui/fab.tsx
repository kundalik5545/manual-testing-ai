import * as React from 'react';
import { cn } from '@/lib/utils';

export function FAB({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'bg-primary focus:ring-primary/50 fixed right-6 bottom-6 z-50 inline-flex items-center rounded-full text-white shadow-lg hover:shadow-xl focus:ring-2 focus:outline-none',
        'h-12 w-12 justify-center',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default FAB;
