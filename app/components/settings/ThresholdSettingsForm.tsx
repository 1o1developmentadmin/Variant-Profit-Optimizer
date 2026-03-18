import { useState } from "react";

interface ThresholdInitial {
  lowMarginThresholdPct: number;
  highRefundThresholdPct: number;
  lowStockDaysThreshold: number;
  confidenceMinThreshold: number;
  updatedAt: string | null;
}

const DEFAULTS = {
  lowMarginThresholdPct: 15,
  highRefundThresholdPct: 8,
  lowStockDaysThreshold: 10,
  confidenceMinThreshold: 0.6,
};

export function ThresholdSettingsForm({ initial }: { initial: ThresholdInitial }) {
  const [form, setForm] = useState({
    lowMarginThresholdPct: initial.lowMarginThresholdPct,
    highRefundThresholdPct: initial.highRefundThresholdPct,
    lowStockDaysThreshold: initial.lowStockDaysThreshold,
    confidenceMinThreshold: initial.confidenceMinThreshold,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);
  const [justSaved, setJustSaved] = useState(false);

  const handleChange = (
    field: keyof typeof form,
    value: string,
  ) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setForm((prev) => ({ ...prev, [field]: num }));
      setIsDirty(true);
      setJustSaved(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS });
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string; updatedAt?: string };
      if (!res.ok) {
        setError(json.error ?? "Save failed");
      } else {
        setSavedAt(json.updatedAt ?? null);
        setIsDirty(false);
        setJustSaved(true);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-section heading="Scoring Thresholds">
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
      {justSaved && !isDirty && (
        <s-banner tone="info">
          <s-paragraph>
            Recommendations will update shortly as your new thresholds are
            applied.
          </s-paragraph>
        </s-banner>
      )}

      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small">
          <label htmlFor="lowMarginThresholdPct">
            Low margin threshold (%)
          </label>
          <input
            id="lowMarginThresholdPct"
            type="number"
            value={form.lowMarginThresholdPct}
            min={1}
            max={100}
            step={1}
            onChange={(e) => handleChange("lowMarginThresholdPct", e.target.value)}
          />
          <s-text>Variants below this margin % are flagged as low-margin</s-text>
        </s-stack>

        <s-stack direction="block" gap="small">
          <label htmlFor="highRefundThresholdPct">
            Refund risk threshold (%)
          </label>
          <input
            id="highRefundThresholdPct"
            type="number"
            value={form.highRefundThresholdPct}
            min={1}
            max={100}
            step={1}
            onChange={(e) => handleChange("highRefundThresholdPct", e.target.value)}
          />
          <s-text>Variants with refund rate above this % are flagged</s-text>
        </s-stack>

        <s-stack direction="block" gap="small">
          <label htmlFor="lowStockDaysThreshold">
            Stockout threshold (days)
          </label>
          <input
            id="lowStockDaysThreshold"
            type="number"
            value={form.lowStockDaysThreshold}
            min={1}
            max={365}
            step={1}
            onChange={(e) => handleChange("lowStockDaysThreshold", e.target.value)}
          />
          <s-text>
            Variants with fewer than this many days of stock are flagged
          </s-text>
        </s-stack>

        <s-stack direction="block" gap="small">
          <label htmlFor="confidenceMinThreshold">
            Confidence minimum threshold (0.1 – 1.0)
          </label>
          <input
            id="confidenceMinThreshold"
            type="number"
            value={form.confidenceMinThreshold}
            min={0.1}
            max={1.0}
            step={0.05}
            onChange={(e) => handleChange("confidenceMinThreshold", e.target.value)}
          />
          <s-text>
            Recommendations below this confidence score are suppressed
          </s-text>
        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? "Saving..." : "Save"}
          </s-button>
          <s-button variant="secondary" onClick={handleReset}>
            Reset to defaults
          </s-button>
        </s-stack>

        {savedAt && (
          <s-text>Last updated: {new Date(savedAt).toLocaleString()}</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
