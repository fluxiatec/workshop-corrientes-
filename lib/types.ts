export type WorkshopCase = {
  id: string;
  session_id: string;
  name: string;
  task: string;
  occupation?: string | null; // a qué se dedica (puede faltar en casos viejos)
  is_selected: boolean;
  is_hidden: boolean;
  archived_at: string | null;
  created_at: string;
};

export const MAX_SELECTED = 3;
