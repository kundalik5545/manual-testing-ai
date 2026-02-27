import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="bg-card border-b">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div>
            <p className="text-sm font-semibold">Regression Report Viewer</p>
            <p className="text-muted-foreground text-xs">Next.js Migration</p>
          </div>
        </div>

        <p className="text-muted-foreground hidden text-xs sm:block">
          GLOBAL SEARCH
        </p>
      </div>
    </header>
  );
}
