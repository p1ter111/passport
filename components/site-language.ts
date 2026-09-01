"use client";

import { useEffect, useState } from "react";

export type SiteLocale = string;

function readLocale(): SiteLocale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("passport-atlas-language") || "en";
}

const rtlLocales = new Set(["ar", "dv", "fa", "he", "ps", "sd", "ug", "ur", "yi"]);

export function useSiteLanguage() {
  const [locale, setLocale] = useState<SiteLocale>("en");

  useEffect(() => {
    const sync = () => {
      const nextLocale = readLocale();
      setLocale(nextLocale);
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = rtlLocales.has(nextLocale) ? "rtl" : "ltr";
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("passport-atlas-language-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("passport-atlas-language-change", sync);
    };
  }, []);

  return locale;
}
