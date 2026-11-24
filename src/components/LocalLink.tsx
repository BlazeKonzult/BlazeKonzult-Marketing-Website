"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useT } from "@/components/SiteData";

/** next/link that keeps visitors in their language: internal links get the /nl prefix on Dutch pages. */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { lp } = useT();
  return <NextLink href={typeof href === "string" ? lp(href) : href} {...props} />;
}
