import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card rounded-md border p-3 shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('mb-2', className)} {...props} />;
}

export function CardTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h3'>) {
  return (
    <h3 className={cn('text-sm font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('mt-3', className)} {...props} />;
}

export default Card;
