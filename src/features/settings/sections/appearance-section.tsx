import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function AppearanceSection() {
   const { theme, setTheme } = useTheme();

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
               <Monitor className="size-4" />
               Apariencia
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <p className="mb-3 text-xs text-muted-foreground">
               Cambia entre modo oscuro y claro. Se guarda automaticamente para
               proximas sesiones.
            </p>
            <div className="flex flex-wrap gap-2">
               <Button
                  type="button"
                  size="sm"
                  variant={theme === "dark" ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setTheme("dark")}
               >
                  <Moon className="mr-1.5 size-3.5" />
                  Modo oscuro
               </Button>
               <Button
                  type="button"
                  size="sm"
                  variant={theme === "light" ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setTheme("light")}
               >
                  <Sun className="mr-1.5 size-3.5" />
                  Modo claro
               </Button>
            </div>
         </CardContent>
      </Card>
   );
}
