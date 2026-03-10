export function readJsonFromStorage<T>(
   key: string,
   fallback: T,
   parse: (raw: unknown) => T | null,
) {
   if (typeof window === "undefined") {
      return fallback;
   }

   const persisted = window.localStorage.getItem(key);
   if (!persisted) {
      return fallback;
   }

   try {
      const parsed = JSON.parse(persisted);
      return parse(parsed) ?? fallback;
   } catch {
      return fallback;
   }
}

export function writeJsonToStorage<T>(key: string, value: T) {
   if (typeof window === "undefined") {
      return;
   }
   window.localStorage.setItem(key, JSON.stringify(value));
}
