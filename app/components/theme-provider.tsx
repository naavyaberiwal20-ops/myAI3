"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = {
  children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: Props & React.ComponentProps<typeof NextThemesProvider>) {
  // defaultTheme "system" lets users switch between light/dark
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...(props as any)}>
      {children}
    </NextThemesProvider>
  );
}
