import { useState } from "react";
import type { RecommendationRules } from "../../routes/api.settings";

interface Props {
  initial: {
    recommendationRules: RecommendationRules;
    updatedAt: string | null;
  };
}

const RULE_LABELS: Array<{
  key: keyof RecommendationRules;
  label: string;
  description: string;
}> = [
  {
    key: "push",
    label: "Push recommendations",
    description:
      "Show recommendations to increase price or promote high-margin variants",
  },
  {
    key: "deprioritize",
    label: "Deprioritize recommendations",
    description:
      "Show recommendations to discount or deprioritize low-margin variants",
  },
  {
    key: "restock",
    label: "Restock recommendations",
    description: "Show recommendations to reorder variants at stockout risk",
  },
  {
    key: "refundInvestigation",
    label: "Refund investigation recommendations",
    description:
      "Show recommendations to investigate variants with high refund rates",
  },
];

export function RecommendationRulesForm({ initial }: Props) {
  const [rules, setRules] = useState<RecommendationRules>(
    initial.recommendationRules,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);

  const handleToggle = (key: keyof RecommendationRules, value: boolean) => {
    setRules((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationRules: rules }),
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

  return (
    <s-section heading="Recommendation Rules">
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

      <s-stack direction="block" gap="base">
        {RULE_LABELS.map(({ key, label, description }) => (
          <s-stack key={key} direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center">
              <input
                type="checkbox"
                id={`rule-${key}`}
                checked={rules[key]}
                onChange={(e) => handleToggle(key, e.target.checked)}
              />
              <label htmlFor={`rule-${key}`}>{label}</label>
            </s-stack>
            <s-text>{description}</s-text>
          </s-stack>
        ))}

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
