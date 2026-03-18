import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  // GDPR: no customer personal data stored; nothing to redact
  return new Response();
};
