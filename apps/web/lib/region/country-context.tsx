"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CountryCodeLower, CountryDefinition } from "@/config/countries";

type CountryContextValue = {
  countrySlug: CountryCodeLower;
  country: CountryDefinition;
};

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({
  children,
  countrySlug,
  country,
}: {
  children: ReactNode;
  countrySlug: CountryCodeLower;
  country: CountryDefinition;
}) {
  return (
    <CountryContext.Provider value={{ countrySlug, country }}>{children}</CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error("useCountry must be used within CountryProvider");
  }
  return ctx;
}

export function useCountryOptional(): CountryContextValue | null {
  return useContext(CountryContext);
}
