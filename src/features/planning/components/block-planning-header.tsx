export function BlockPlanningHeader({ blockDurationMinutes }: { blockDurationMinutes: number }) {
   return (
      <div className="space-y-1">
         <p className="text-xs font-semibold text-foreground">Bloques de clase</p>
         <p className="text-[11px] text-muted-foreground">
            Duracion por bloque: {blockDurationMinutes} min. Solo puedes editar su contenido.
         </p>
      </div>
   );
}
