import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTeacherContext } from "@/features/teacher";
import { toast } from "sonner";

function buildAvatar(name: string, lastName: string) {
   const first = name.trim().charAt(0).toUpperCase();
   const last = lastName.trim().charAt(0).toUpperCase();
   return `${first}${last}`.trim();
}

export function ProfileSection() {
   const { teacherProfile, updateTeacherProfile } = useTeacherContext();
   const [name, setName] = useState(teacherProfile.name);
   const [lastName, setLastName] = useState(teacherProfile.lastName);
   const [email, setEmail] = useState(teacherProfile.email);
   const [avatar, setAvatar] = useState(teacherProfile.avatar);

   useEffect(() => {
      setName(teacherProfile.name);
      setLastName(teacherProfile.lastName);
      setEmail(teacherProfile.email);
      setAvatar(teacherProfile.avatar);
   }, [teacherProfile]);

   const handleSave = () => {
      if (!name.trim() || !lastName.trim() || !email.trim()) {
         toast.error("Nombre, apellido y email son obligatorios.");
         return;
      }
      if (!email.includes("@")) {
         toast.error("Ingresa un email valido.");
         return;
      }

      updateTeacherProfile({
         name,
         lastName,
         email,
         avatar: avatar.trim() || buildAvatar(name, lastName),
      });
      toast.success("Cuenta docente actualizada.");
   };

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
                     {avatar.trim() || buildAvatar(name, lastName)}
                  </AvatarFallback>
               </Avatar>
               <div className="flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre</Label>
                        <Input
                           className="h-9 text-xs"
                           value={name}
                           onChange={(event) => setName(event.target.value)}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Apellido</Label>
                        <Input
                           className="h-9 text-xs"
                           value={lastName}
                           onChange={(event) => setLastName(event.target.value)}
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Email</Label>
                     <Input
                        className="h-9 text-xs"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Avatar (initials)</Label>
                     <Input
                        className="h-9 text-xs"
                        maxLength={2}
                        value={avatar}
                        onChange={(event) => setAvatar(event.target.value.toUpperCase())}
                     />
                  </div>
                  <Button
                     size="sm"
                     className="w-fit text-xs"
                     onClick={handleSave}
                  >
                     Guardar cambios
                  </Button>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
