import {
   createContext,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react";

type AppTheme = "dark" | "light";

type ThemeContextValue = {
   theme: AppTheme;
   setTheme: (theme: AppTheme) => void;
   toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "app-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: AppTheme) {
   const root = document.documentElement;
   root.classList.remove("dark", "light");
   root.classList.add(theme);
}

function getInitialTheme(): AppTheme {
   if (typeof window === "undefined") {
      return "dark";
   }

   const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
   if (stored === "dark" || stored === "light") {
      return stored;
   }

   return "dark";
}

type ThemeProviderProps = {
   children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
   const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);

   useEffect(() => {
      applyThemeClass(theme);
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
   }, [theme]);

   const value = useMemo<ThemeContextValue>(
      () => ({
         theme,
         setTheme: setThemeState,
         toggleTheme: () =>
            setThemeState((prevTheme) => (prevTheme === "dark" ? "light" : "dark")),
      }),
      [theme],
   );

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
   const context = useContext(ThemeContext);
   if (!context) {
      throw new Error("useTheme must be used within ThemeProvider");
   }
   return context;
}
