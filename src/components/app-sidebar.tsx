import { Link, useLocation } from "react-router-dom";
import {
   LayoutDashboard,
   CalendarDays,
   Users,
   BarChart3,
   FolderOpen,
   Settings,
   GraduationCap,
} from "lucide-react";

import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
   useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teacherProfile } from "@/lib/edu-repository";

const navItems = [
   { title: "Dashboard", url: "/", icon: LayoutDashboard },
   { title: "Planificacion", url: "/planificacion", icon: CalendarDays },
   { title: "Mis Grupos", url: "/grupos", icon: Users },
   { title: "Seguimiento", url: "/seguimiento", icon: BarChart3 },
   { title: "Contenidos", url: "/contenidos", icon: FolderOpen },
   { title: "Configuracion", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
   const { pathname } = useLocation();
   const { state } = useSidebar();
   const collapsed = state === "collapsed";

   return (
      <Sidebar collapsible="icon">
         <SidebarHeader className="border-b border-sidebar-border pb-3">
            <div className="flex items-center gap-2.5 px-1 py-1">
               <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
               </div>
               {!collapsed && (
                  <div className="flex flex-col">
                     <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
                        EduFlow
                     </span>
                     <span className="text-[11px] text-muted-foreground leading-none">
                        Gestion Docente
                     </span>
                  </div>
               )}
            </div>
         </SidebarHeader>

         <SidebarContent>
            <SidebarGroup>
               <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
               <SidebarGroupContent>
                  <SidebarMenu>
                     {navItems.map((item) => {
                        const isActive =
                           pathname === item.url ||
                           (item.url !== "/" && pathname.startsWith(item.url));
                        return (
                           <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                 asChild
                                 isActive={isActive}
                                 tooltip={item.title}
                              >
                                 <Link to={item.url}>
                                    <item.icon className="size-4" />
                                    <span>{item.title}</span>
                                 </Link>
                              </SidebarMenuButton>
                           </SidebarMenuItem>
                        );
                     })}
                  </SidebarMenu>
               </SidebarGroupContent>
            </SidebarGroup>
         </SidebarContent>

         <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 px-1 py-1">
               <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                     {teacherProfile.avatar}
                  </AvatarFallback>
               </Avatar>
               {!collapsed && (
                  <div className="flex flex-col min-w-0">
                     <span className="text-xs font-medium text-sidebar-foreground truncate">
                        {teacherProfile.name} {teacherProfile.lastName}
                     </span>
                     <span className="text-[10px] text-muted-foreground truncate">
                        {teacherProfile.email}
                     </span>
                  </div>
               )}
            </div>
         </SidebarFooter>

         <SidebarRail />
      </Sidebar>
   );
}

