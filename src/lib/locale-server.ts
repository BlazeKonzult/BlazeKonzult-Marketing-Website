import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Loc } from "./locale";

/** Language of the current request (set by src/proxy.ts). */
export const getLocale = cache(async (): Promise<Loc> => ((await headers()).get("x-bk-locale") === "nl" ? "nl" : "en"));
/** Path of the current page without the /nl prefix. */
export const getBasePath = cache(async (): Promise<string> => (await headers()).get("x-bk-path") ?? "/");
