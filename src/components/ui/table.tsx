import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortable?: boolean;
  onRowClick?: (row: T) => void;
}

type SortState<T> = {
  key: keyof T | string;
  direction: 'asc' | 'desc';
} | null;

export function Table<T extends object>({
  columns,
  data,
  sortable = true,
  onRowClick,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState<T>>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return data;

    const getSortableValue = (row: T, key: keyof T | string): unknown => {
      if (typeof key === 'string' && !(key in row)) {
        return undefined;
      }

      return row[key as keyof T];
    };

    return [...data].sort((a, b) => {
      const left = getSortableValue(a, sort.key);
      const right = getSortableValue(b, sort.key);

      if (left === right) return 0;
      if (left == null) return 1;
      if (right == null) return -1;

      const result = String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sort.direction === 'asc' ? result : -result;
    });
  }, [data, sort]);

  const handleSort = (column: Column<T>) => {
    if (!sortable || !column.sortable) return;

    setSort((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: 'asc' };
      }

      return {
        key: column.key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-muted sticky top-0 z-10">
          <tr>
            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              const isSortActive = isSorted ? sort?.direction : null;

              return (
                <th
                  key={String(column.key)}
                  style={column.width ? { width: column.width } : undefined}
                  scope="col"
                  className={cn(
                    'text-foreground border-b px-3 py-2 text-left font-medium',
                    column.sortable && sortable
                      ? 'cursor-pointer select-none'
                      : '',
                  )}
                  onClick={() => handleSort(column)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortable ? (
                      isSortActive === 'asc' ? (
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      ) : isSortActive === 'desc' ? (
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      ) : null
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'odd:bg-background even:bg-muted/30 hover:bg-accent/60',
                onRowClick ? 'cursor-pointer' : '',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const hasKey =
                  typeof column.key === 'string' && column.key in row;
                const cellValue = hasKey
                  ? row[column.key as keyof T]
                  : undefined;

                return (
                  <td
                    key={String(column.key)}
                    className="border-b px-3 py-2 align-top"
                  >
                    {column.render
                      ? column.render(cellValue, row)
                      : String(cellValue ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
