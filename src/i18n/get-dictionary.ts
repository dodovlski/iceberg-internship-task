import type { Locale } from "@/src/types";
import { en } from "./dictionaries/en";
import { tr } from "./dictionaries/tr";

export function getDictionary(locale: Locale) {
  return locale === "tr" ? tr : en;
}

export function normaliseLocale(locale: string): Locale {
  return locale === "tr" ? "tr" : "en";
}
