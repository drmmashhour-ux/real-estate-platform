import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ children, className = "", ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ds-border bg-ds-card">
      <table className={["w-full min-w-[640px] border-collapse text-left text-sm", className].join(" ")} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className = "", ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={["border-b border-ds-border bg-ds-surface text-xs font-semibold uppercase tracking-wide text-ds-text-secondary", className].join(" ")} {...rest}>
      {children}
    </thead>
  );
}

export function TBody({ children, className = "", ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={["divide-y divide-ds-border text-ds-text", className].join(" ")} {...rest}>
      {children}
    </tbody>
  );
}

export function Tr({ children, className = "", ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={["transition hover:bg-ds-surface/80", className].join(" ")} {...rest}>
      {children}
    </tr>
  );
}

export function Th({ children, className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={["px-4 py-3 font-semibold", className].join(" ")} {...rest}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={["px-4 py-3 text-ds-text-secondary", className].join(" ")} {...rest}>
      {children}
    </td>
  );
}
