import { Outlet, redirect, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
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
  const error = useRouteError();
  // boundary.error() uses error.constructor.name === 'ErrorResponseImpl' internally,
  // which breaks in minified/production builds where class names are mangled (e.g. "Co").
  // When the check fails, boundary.error() re-throws, causing a cascade that triggers
  // componentDidCatch and the "React Router caught the following error during render" console errors.
  //
  // Fix: use isRouteErrorResponse() which checks properties (not class names) — reliable in all builds.
  // For route errors, replicate boundary.error()'s actual behavior: render error.data as HTML.
  // Auth redirects still work because boundary.headers() sets the Location header separately.
  if (isRouteErrorResponse(error)) {
    return (
      <div dangerouslySetInnerHTML={{ __html: error.data || "Handling response" }} />
    );
  }
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Something went wrong</h2>
      <p style={{ color: "#666" }}>
        {error instanceof Error ? error.message : String(error)}
      </p>
      {error instanceof Error && (
        <pre style={{ fontSize: "12px", color: "#999", whiteSpace: "pre-wrap" }}>
          {error.stack}
        </pre>
      )}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
