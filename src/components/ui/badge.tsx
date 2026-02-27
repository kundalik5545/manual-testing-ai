import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-secondary text-secondary-foreground',
        warning: 'bg-accent text-accent-foreground',
        danger: 'bg-destructive text-primary-foreground',
        info: 'bg-primary text-primary-foreground',
        neutral: 'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
