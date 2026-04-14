import { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const hasHydrated = useRef(false);

  useEffect(() => {
    const root = document.documentElement;

    if (!hasHydrated.current) {
      const storedTheme = window.localStorage.getItem("theme");
      const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "light";

      if (initialTheme !== theme) {
        setTheme(initialTheme);
      }

      root.classList.toggle("dark", initialTheme === "dark");
      window.localStorage.setItem("theme", initialTheme);
      hasHydrated.current = true;
      return;
    }

    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
