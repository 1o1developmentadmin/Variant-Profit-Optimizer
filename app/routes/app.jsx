import { Outlet, redirect, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // Check onboarding status and redirect new merchants
  if (shop) {
    const shopRecord = await db.shop.findUnique({ where: { shopDomain: shop } });
    const isOnboardingRoute = url.pathname === "/app/onboarding";
    if (!isOnboardingRoute && (!shopRecord || !shopRecord.onboardingComplete)) {
      throw redirect(`/app/onboarding?shop=${shop}`);
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Overview</s-link>
        <s-link href="/app/recommendations">Recommendations</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/variants">Variants</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
