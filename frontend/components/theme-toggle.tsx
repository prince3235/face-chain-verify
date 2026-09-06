"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="relative flex h-8 w-16 items-center rounded-full border border-border bg-surface-raised px-1 transition-colors"
    >
      <motion.div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-scan"
        animate={{ x: isDark ? 0 : 32 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </motion.div>
    </button>
  );
}
