import { authenticate } from "../shopify.server";
import type { Route } from "./+types/app.variants";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Variants() {
  return (
    <s-page heading="Variants">
      <s-section heading="Variant profit analysis">
        <s-paragraph>
          No variant data yet. Sync your store to see per-variant profit scores.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
