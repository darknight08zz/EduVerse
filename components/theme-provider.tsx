"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

// Fix for React 19+: Suppress "Encountered a script tag" warning from next-themes
// This must be at the top level to catch errors during initial render/hydration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = args[0]?.toString() || "";
    if (firstArg.includes('Encountered a script tag')) return;
    origError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
