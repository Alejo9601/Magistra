export type GroupDetailProps = {
   assignmentId: string;
   onBack: () => void;
};

export type GroupPendingDelete = {
   kind: "assessment" | "activity";
   id: string;
   title: string;
};
