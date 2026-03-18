import { TitleBar } from "@shopify/app-bridge-react";
import type { ReactNode } from "react";

interface AppPageProps {
  title: string;
  children: ReactNode;
  primaryAction?: ReactNode;
}

export function AppPage({ title, children, primaryAction }: AppPageProps) {
  return (
    <>
      <TitleBar title={title} />
      <s-page heading={title}>
        {primaryAction && <span slot="primary-action">{primaryAction}</span>}
        {children}
      </s-page>
    </>
  );
}
