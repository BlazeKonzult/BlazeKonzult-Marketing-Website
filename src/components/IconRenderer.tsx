import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconRendererProps = LucideProps & { name: string };

/** Renders a lucide-react icon by string name (used since data.ts stores icon names as strings). */
export default function IconRenderer({ name, ...props }: IconRendererProps) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} aria-hidden="true" />;
}
