import type { SetupHealthData } from "../../routes/api.setup-health";

interface SetupHealthCardProps {
  health: SetupHealthData;
  onRetrySync?: () => void;
}

export function SetupHealthCard({ health, onRetrySync }: SetupHealthCardProps) {
  const {
    costCoverage,
    inventoryCoverage,
    hasAllOrdersScope,
    refundDataAvailable,
    lastSyncAt,
    syncStatus,
    syncStage,
  } = health;

  return (
    <s-section heading="Setup health">
      {syncStatus === "running" && syncStage && (
        <s-banner tone="info">
          <s-paragraph>
            Sync in progress — {syncStage}. Some data may be incomplete.
          </s-paragraph>
        </s-banner>
      )}
      {syncStatus === "failed" && (
        <s-banner tone="critical">
          <s-paragraph>Last sync failed.</s-paragraph>
          {onRetrySync && (
            <s-button variant="secondary" onClick={onRetrySync}>
              Retry sync
            </s-button>
          )}
        </s-banner>
      )}

      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Cost coverage</s-text>
          <s-badge tone={costCoverage >= 50 ? "success" : "warning"}>
            {costCoverage}%
          </s-badge>
        </s-stack>

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Inventory coverage</s-text>
          <s-badge tone={inventoryCoverage >= 50 ? "success" : "warning"}>
            {inventoryCoverage}%
          </s-badge>
        </s-stack>

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Extended order history (read_all_orders)</s-text>
          <s-badge tone={hasAllOrdersScope ? "success" : "warning"}>
            {hasAllOrdersScope ? "Granted" : "Not granted"}
          </s-badge>
        </s-stack>

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Refund data</s-text>
          <s-badge tone={refundDataAvailable ? "success" : "neutral"}>
            {refundDataAvailable ? "Available" : "Not yet available"}
          </s-badge>
        </s-stack>

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>Last full sync</s-text>
          <s-text>
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
          </s-text>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
