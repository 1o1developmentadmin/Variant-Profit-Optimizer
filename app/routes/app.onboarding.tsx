import { useEffect, useRef } from "react";
import {
  Form,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { startFullSync } from "../lib/sync/sync.service";
import type { Route } from "./+types/app.onboarding";

const TOTAL_STEPS = 6;
const SYNC_RANGE_OPTIONS = [
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days (recommended)" },
  { value: 365, label: "365 days" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const step = parseInt(url.searchParams.get("step") ?? "1", 10);

  const shopRecord = await db.shop.findUnique({
    where: { shopDomain: session.shop },
    include: { settings: true },
  });

  // Returning merchants who finished onboarding skip straight to overview
  if (shopRecord?.onboardingComplete) {
    throw redirect(`/app?shop=${session.shop}`);
  }

  return {
    shop: session.shop,
    step,
    hasAllOrdersScope: shopRecord?.hasAllOrdersScope ?? false,
    syncRange: shopRecord?.syncRange ?? 180,
    settings: shopRecord?.settings ?? null,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const currentStep = parseInt(formData.get("step") as string, 10);
  const nextStep = currentStep + 1;
  const shop = session.shop;

  switch (currentStep) {
    case 1:
      // Welcome — no data to save
      break;

    case 2: {
      const syncRange = parseInt(formData.get("syncRange") as string, 10);
      await db.shop.upsert({
        where: { shopDomain: shop },
        update: { syncRange },
        create: { shopDomain: shop, syncRange },
      });
      break;
    }

    case 3:
      // Cost setup — no direct user data; settings configured in step 4
      break;

    case 4: {
      const lowMarginThreshold = parseFloat(
        formData.get("lowMarginThreshold") as string,
      );
      const refundRiskThreshold = parseFloat(
        formData.get("refundRiskThreshold") as string,
      );
      const stockoutThreshold = parseInt(
        formData.get("stockoutThreshold") as string,
        10,
      );
      await db.merchantSettings.upsert({
        where: { shopDomain: shop },
        update: { lowMarginThreshold, refundRiskThreshold, stockoutThreshold },
        create: {
          shopDomain: shop,
          lowMarginThreshold,
          refundRiskThreshold,
          stockoutThreshold,
        },
      });
      // Trigger background sync — runs asynchronously while user views step 5
      await startFullSync(shop);
      break;
    }

    case 5:
      // Sync progress — no form submission; user advances when ready
      break;

    case 6:
      // Mark onboarding complete
      await db.shop.upsert({
        where: { shopDomain: shop },
        update: { onboardingComplete: true },
        create: { shopDomain: shop, onboardingComplete: true },
      });
      throw redirect(`/app?shop=${shop}`);
  }

  return { nextStep };
};

// --- Sub-components ---

function StepIndicator({ current }: { current: number }) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <s-badge
          key={i + 1}
          tone={
            i + 1 < current
              ? "success"
              : i + 1 === current
                ? "info"
                : "neutral"
          }
        >
          {String(i + 1)}
        </s-badge>
      ))}
      <s-text>Step {current} of {TOTAL_STEPS}</s-text>
    </s-stack>
  );
}

function Step1Welcome({
  shop,
  onNext,
}: {
  shop: string;
  onNext: () => void;
}) {
  return (
    <s-section heading="Welcome to Variant Profit Optimizer">
      <s-paragraph>
        Maximize your store's profitability by identifying which variants to
        promote, discount, or discontinue — all driven by real margin and sales
        data.
      </s-paragraph>
      <s-stack direction="inline" gap="base">
        <Form method="post" onSubmit={onNext}>
          <input type="hidden" name="step" value="1" />
          <s-button type="submit" variant="primary">
            Get started
          </s-button>
        </Form>
      </s-stack>
    </s-section>
  );
}

function Step2SyncRange({
  hasAllOrdersScope,
  syncRange,
  shop,
}: {
  hasAllOrdersScope: boolean;
  syncRange: number;
  shop: string;
}) {
  return (
    <s-section heading="Choose your sync range">
      <s-paragraph>
        How far back should we sync your order history to calculate profit
        scores?
      </s-paragraph>
      {!hasAllOrdersScope && (
        <s-banner tone="warning">
          <s-paragraph>
            To sync more than 60 days, re-authorize with extended history
            access.
          </s-paragraph>
          <s-button
            variant="secondary"
            onClick={() =>
              (window.location.href = `/auth?shop=${shop}`)
            }
          >
            Re-authorize for full history
          </s-button>
        </s-banner>
      )}
      <Form method="post">
        <input type="hidden" name="step" value="2" />
        <s-stack direction="block" gap="base">
          {SYNC_RANGE_OPTIONS.map(({ value, label }) => {
            const disabled = !hasAllOrdersScope && value > 60;
            return (
              <s-stack key={value} direction="inline" gap="small" alignItems="center">
                <input
                  type="radio"
                  id={`range-${value}`}
                  name="syncRange"
                  value={String(value)}
                  defaultChecked={syncRange === value}
                  disabled={disabled}
                />
                <label htmlFor={`range-${value}`}>
                  {label}
                  {disabled && (
                    <>
                      {" "}
                      <s-badge tone="neutral">Requires re-auth</s-badge>
                    </>
                  )}
                </label>
              </s-stack>
            );
          })}
          <s-button type="submit" variant="primary">
            Continue
          </s-button>
        </s-stack>
      </Form>
    </s-section>
  );
}

function Step3CostSetup() {
  // Cost coverage % comes from EPIC-02 sync; stub 0% here
  const costCoverage = 0;
  const lowCoverage = costCoverage < 50;

  return (
    <s-section heading="Cost data setup">
      <s-paragraph>
        Profit scores require cost-of-goods data for each variant. We found cost
        data for <strong>{costCoverage}%</strong> of your variants.
      </s-paragraph>
      {lowCoverage && (
        <s-banner tone="warning">
          <s-paragraph>
            Profit scores will be unavailable for many variants until cost data
            is added. You can update costs in{" "}
            <s-link href="/app/settings">Settings › Cost Settings</s-link>{" "}
            after onboarding.
          </s-paragraph>
        </s-banner>
      )}
      <s-paragraph>
        We'll use the <strong>Shopify inventory cost</strong> (cost per item) as
        the default. You can override individual variant costs in Settings.
      </s-paragraph>
      <Form method="post">
        <input type="hidden" name="step" value="3" />
        <s-button type="submit" variant="primary">
          Continue
        </s-button>
      </Form>
    </s-section>
  );
}

function Step4Thresholds({
  settings,
}: {
  settings: {
    lowMarginThreshold: number;
    refundRiskThreshold: number;
    stockoutThreshold: number;
  } | null;
}) {
  const defaults = {
    lowMarginThreshold: settings?.lowMarginThreshold ?? 15,
    refundRiskThreshold: settings?.refundRiskThreshold ?? 8,
    stockoutThreshold: settings?.stockoutThreshold ?? 10,
  };

  return (
    <s-section heading="Set decision thresholds">
      <s-paragraph>
        These thresholds determine when variants are flagged. You can change
        them anytime in Settings.
      </s-paragraph>
      <Form method="post">
        <input type="hidden" name="step" value="4" />
        <s-stack direction="block" gap="base">
          <s-stack direction="block" gap="small">
            <label htmlFor="lowMarginThreshold">
              Low margin threshold (%)
            </label>
            <input
              id="lowMarginThreshold"
              type="number"
              name="lowMarginThreshold"
              defaultValue={defaults.lowMarginThreshold}
              min={0}
              max={100}
              step={1}
            />
            <s-text>
              Variants below this margin % are flagged as low-margin
            </s-text>
          </s-stack>
          <s-stack direction="block" gap="small">
            <label htmlFor="refundRiskThreshold">
              Refund risk threshold (%)
            </label>
            <input
              id="refundRiskThreshold"
              type="number"
              name="refundRiskThreshold"
              defaultValue={defaults.refundRiskThreshold}
              min={0}
              max={100}
              step={1}
            />
            <s-text>
              Variants with refund rate above this % are flagged
            </s-text>
          </s-stack>
          <s-stack direction="block" gap="small">
            <label htmlFor="stockoutThreshold">
              Stockout threshold (days)
            </label>
            <input
              id="stockoutThreshold"
              type="number"
              name="stockoutThreshold"
              defaultValue={defaults.stockoutThreshold}
              min={1}
              step={1}
            />
            <s-text>
              Variants with fewer than this many days of stock remaining are
              flagged
            </s-text>
          </s-stack>
          <s-button type="submit" variant="primary">
            Save and continue
          </s-button>
        </s-stack>
      </Form>
    </s-section>
  );
}

function Step5SyncProgress({ shop }: { shop: string }) {
  const fetcher = useFetcher<{ syncStage: string | null; syncProgress: number }>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll sync status every 4 seconds
    const poll = () => {
      fetcher.load(`/api/setup-health?shop=${shop}`);
    };
    poll();
    intervalRef.current = setInterval(poll, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  const syncData = fetcher.data;
  const stages = ["Products", "Orders", "Inventory", "Refunds", "Transactions"];

  return (
    <s-section heading="Syncing your store data">
      <s-paragraph>
        We're pulling in your store data to calculate profit scores. This may
        take a few minutes.
      </s-paragraph>
      <s-stack direction="block" gap="base">
        {stages.map((stage) => (
          <s-stack key={stage} direction="inline" gap="small" alignItems="center">
            <s-spinner size="base" />
            <s-text>{stage}</s-text>
          </s-stack>
        ))}
      </s-stack>
      {syncData && (
        <s-banner tone="info">
          <s-paragraph>
            {syncData.syncStage ?? "Syncing..."}{" "}
            {syncData.syncProgress != null
              ? `— ${syncData.syncProgress}%`
              : ""}
          </s-paragraph>
        </s-banner>
      )}
      <Form method="post" style={{ marginTop: "16px" }}>
        <input type="hidden" name="step" value="5" />
        <s-button type="submit" variant="primary">
          Continue
        </s-button>
      </Form>
    </s-section>
  );
}

function Step6FirstRecommendations() {
  return (
    <s-section heading="Your first insights">
      <s-banner tone="info">
        <s-paragraph>
          Calculating your first insights… This may take a moment while we
          finish analyzing your data.
        </s-paragraph>
      </s-banner>
      <s-paragraph>
        Once ready, you'll see your top recommendations on the Overview page.
        Click below to enter the app.
      </s-paragraph>
      <Form method="post">
        <input type="hidden" name="step" value="6" />
        <s-button type="submit" variant="primary">
          Go to Overview
        </s-button>
      </Form>
    </s-section>
  );
}

// --- Main Route Component ---

export default function Onboarding() {
  const { step, hasAllOrdersScope, syncRange, settings, shop } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const currentStep = actionData?.nextStep ?? step;

  const handleNoOp = () => undefined;

  return (
    <s-page heading="Set up Variant Profit Optimizer">
      <s-section>
        <StepIndicator current={currentStep} />
      </s-section>

      {currentStep === 1 && (
        <Step1Welcome shop={shop} onNext={handleNoOp} />
      )}
      {currentStep === 2 && (
        <Step2SyncRange
          hasAllOrdersScope={hasAllOrdersScope}
          syncRange={syncRange}
          shop={shop}
        />
      )}
      {currentStep === 3 && <Step3CostSetup />}
      {currentStep === 4 && <Step4Thresholds settings={settings} />}
      {currentStep === 5 && <Step5SyncProgress shop={shop} />}
      {currentStep === 6 && <Step6FirstRecommendations />}
    </s-page>
  );
}
