import type { ComponentProps } from "react";
import { Skeleton } from "@/components/ui/states";

/** BankDash table: header row in muted caps, thin row dividers, horizontal scroll on small screens. */
export function Table({ className = "", children, ...props }: ComponentProps<"table">) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className={`w-full min-w-[640px] border-collapse text-left text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className = "", children, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={`border-b border-line px-3 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-fg-muted uppercase first:pl-0 last:pr-0 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className = "", children, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={`border-b border-line px-3 py-3 align-middle font-medium text-fg-2 first:pl-0 last:pr-0 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

/** Rows of grey bars while a table loads. */
export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }, (_, col) => (
            <Td key={col}>
              <Skeleton className="h-4 w-full max-w-40" />
            </Td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
