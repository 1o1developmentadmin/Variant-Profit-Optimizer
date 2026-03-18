import React from "react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Array<Record<string, React.ReactNode>>;
  loading?: boolean;
  emptyMessage?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: Record<string, React.ReactNode>) => void;
}

export function DataTable({
  columns,
  rows,
  loading,
  emptyMessage = "No data to display",
  sortKey,
  sortDir,
  onSort,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onRowClick,
}: DataTableProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <s-spinner size="base" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <s-paragraph>{emptyMessage}</s-paragraph>
    );
  }

  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  const showPagination = total > pageSize && onPageChange;

  return (
    <s-stack direction="block" gap="base">
      <s-table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
                {col.sortable && onSort ? (
                  <s-button
                    variant="tertiary"
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}{" "}
                    {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </s-button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </s-table>

      {showPagination && (
        <s-stack direction="inline" gap="small" justifyContent="center">
          <s-button
            variant="tertiary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </s-button>
          <s-text>
            Page {page} of {totalPages}
          </s-text>
          <s-button
            variant="tertiary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </s-button>
        </s-stack>
      )}
    </s-stack>
  );
}
