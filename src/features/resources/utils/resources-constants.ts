import {
   FileText,
   Image,
   Video,
   LinkIcon,
   FileSpreadsheet,
} from "lucide-react";

export const fileTypeIcons: Record<string, React.ElementType> = {
   pdf: FileText,
   image: Image,
   video: Video,
   link: LinkIcon,
   doc: FileSpreadsheet,
};

export const contentTypeLabels: Record<string, string> = {
   apunte: "Apunte",
   consigna: "Consigna",
   evaluacion: "Evaluacion",
   presentacion: "Presentacion",
   link: "Link",
   otro: "Otro",
};
