import { useState } from "react";

interface CostInitial {
  costSourceMode: string;
  allowManualCostOverrides: boolean;
  costCoveragePct: number;
  updatedAt: string | null;
}

export function CostSettingsForm({ initial }: { initial: CostInitial }) {
  const [costSourceMode, setCostSourceMode] = useState(initial.costSourceMode);
  const [allowManualCostOverrides, setAllowManualCostOverrides] = useState(
    initial.allowManualCostOverrides,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);

  const handleModeChange = (mode: string) => {
    setCostSourceMode(mode);
    setIsDirty(true);
  };

  const handleOverridesChange = (v: boolean) => {
    setAllowManualCostOverrides(v);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costSourceMode, allowManualCostOverrides }),
      });
      const json = (await res.json()) as { error?: string; updatedAt?: string };
      if (!res.ok) {
        setError(json.error ?? "Save failed");
      } else {
        setSavedAt(json.updatedAt ?? null);
        setIsDirty(false);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const { costCoveragePct } = initial;

  return (
    <s-section heading="Cost Settings">
      {isDirty && (
        <s-banner tone="warning">
          <s-paragraph>Unsaved changes</s-paragraph>
        </s-banner>
      )}
      {error && (
        <s-banner tone="critical">
          <s-paragraph>{error}</s-paragraph>
          <s-button variant="secondary" onClick={handleSave}>
            Retry
          </s-button>
        </s-banner>
      )}
      {costCoveragePct < 50 && (
        <s-banner tone="warning">
          <s-paragraph>
            Cost data found for {costCoveragePct}% of your variants. Profit
            scores will be incomplete for variants without cost data. Add cost
            data in Shopify admin or enable manual overrides below.
          </s-paragraph>
        </s-banner>
      )}

      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Cost data coverage</s-text>
          <s-badge tone={costCoveragePct >= 50 ? "success" : "warning"}>
            {costCoveragePct}%
          </s-badge>
        </s-stack>

        <s-stack direction="block" gap="small">
          <s-text>Cost source</s-text>
          <s-stack direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center">
              <input
                type="radio"
                id="cost-source-shopify"
                name="costSourceMode"
                value="shopify"
                checked={costSourceMode === "shopify"}
                onChange={() => handleModeChange("shopify")}
              />
              <label htmlFor="cost-source-shopify">
                Use Shopify inventory cost (default)
              </label>
            </s-stack>
            <s-stack direction="inline" gap="small" alignItems="center">
              <input
                type="radio"
                id="cost-source-manual"
                name="costSourceMode"
                value="manual"
                checked={costSourceMode === "manual"}
                onChange={() => handleModeChange("manual")}
              />
              <label htmlFor="cost-source-manual">Manual cost overrides</label>
            </s-stack>
          </s-stack>
        </s-stack>

        <s-stack direction="inline" gap="small" alignItems="center">
          <input
            type="checkbox"
            id="allowManualCostOverrides"
            checked={allowManualCostOverrides}
            onChange={(e) => handleOverridesChange(e.target.checked)}
          />
          <label htmlFor="allowManualCostOverrides">
            Allow manual cost overrides per variant
          </label>
        </s-stack>

        {allowManualCostOverrides && (
          <s-banner tone="info">
            <s-paragraph>
              To set a custom cost for a variant, visit the variant detail page
              in the Variants section.
            </s-paragraph>
          </s-banner>
        )}

        <s-stack direction="inline" gap="base">
          <s-button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? "Saving..." : "Save"}
          </s-button>
        </s-stack>

        {savedAt && (
          <s-text>Last updated: {new Date(savedAt).toLocaleString()}</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
