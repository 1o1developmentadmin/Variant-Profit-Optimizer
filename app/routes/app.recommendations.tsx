import { authenticate } from "../shopify.server";
import type { Route } from "./+types/app.recommendations";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Recommendations() {
  return (
    <s-page heading="Recommendations">
      <s-section heading="Top recommendations">
        <s-paragraph>
          No recommendations yet. Complete onboarding and sync your store data to
          see profit-driven recommendations.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
