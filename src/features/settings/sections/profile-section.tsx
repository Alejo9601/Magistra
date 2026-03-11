import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teacherProfile } from "@/lib/edu-repository";
import { toast } from "sonner";

export function ProfileSection() {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <User className="size-4" />
               Mi perfil
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="flex items-start gap-6">
               <Avatar className="size-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                     {teacherProfile.avatar}
                  </AvatarFallback>
               </Avatar>
               <div className="flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre</Label>
                        <Input
                           className="h-9 text-xs"
                           defaultValue={teacherProfile.name}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Apellido</Label>
                        <Input
                           className="h-9 text-xs"
                           defaultValue={teacherProfile.lastName}
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Email</Label>
                     <Input
                        className="h-9 text-xs"
                        type="email"
                        defaultValue={teacherProfile.email}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Contrasenia</Label>
                     <Input
                        className="h-9 text-xs"
                        type="password"
                        defaultValue="********"
                     />
                  </div>
                  <Button
                     size="sm"
                     className="w-fit text-xs"
                     onClick={() => toast.success("Perfil actualizado")}
                  >
                     Guardar cambios
                  </Button>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
