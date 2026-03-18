import { authenticate } from "../shopify.server";
import type { Route } from "./+types/app.products";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Products() {
  return (
    <s-page heading="Products">
      <s-section heading="Product profit overview">
        <s-paragraph>
          No product data yet. Sync your store to see profit analysis by product.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
