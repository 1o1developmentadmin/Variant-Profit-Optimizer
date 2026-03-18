import { authenticate } from "../shopify.server";
import type { Route } from "./+types/app.settings";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Settings() {
  return (
    <s-page heading="Settings">
      <s-section heading="App settings">
        <s-paragraph>
          Configure cost data, thresholds, and sync preferences.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
