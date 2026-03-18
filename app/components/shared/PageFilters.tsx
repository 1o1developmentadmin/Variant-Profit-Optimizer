interface ActiveFilter {
  key: string;
  label: string;
}

interface PageFiltersProps {
  dateRange: "7d" | "30d" | "90d";
  onDateRangeChange: (range: "7d" | "30d" | "90d") => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: string) => void;
}

export function PageFilters({
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilters = [],
  onRemoveFilter,
}: PageFiltersProps) {
  const ranges: Array<"7d" | "30d" | "90d"> = ["7d", "30d", "90d"];

  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="inline" gap="small">
        {ranges.map((r) => (
          <s-button
            key={r}
            variant={dateRange === r ? "primary" : "secondary"}
            onClick={() => onDateRangeChange(r)}
          >
            {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
          </s-button>
        ))}

        {onSearchChange && (
          <input
            type="text"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "14px",
              minWidth: "200px",
            }}
          />
        )}
      </s-stack>

      {activeFilters.length > 0 && (
        <s-stack direction="inline" gap="small">
          {activeFilters.map((f) => (
            <span key={f.key} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <s-badge tone="neutral">{f.label}</s-badge>
              {onRemoveFilter && (
                <button
                  onClick={() => onRemoveFilter(f.key)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: "12px",
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </s-stack>
      )}
    </s-stack>
  );
}
