"use client";

import { ConfigProvider, theme } from "antd";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // Use resolvedTheme if available (accounts for system preference), fallback to nextTheme
  const currentTheme = resolvedTheme || nextTheme || "dark";

  const antdTheme = {
    algorithm: currentTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
