'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClassMap: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[800px]',
  xl: 'max-w-[1000px]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={cn(
              'bg-card w-full rounded-lg border shadow-sm',
              'max-h-[calc(100vh-2rem)] overflow-y-auto',
              sizeClassMap[size],
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <DialogTitle className="text-base font-semibold">
                {title}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="px-4 py-4">{children}</div>

            {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
