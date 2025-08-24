export interface IQuickloginUser {
  email: string;
  password: string;
  note?: string;
}


export type TQuickActions = { label: string, action: (input: string) => void | Promise<void>, inputLabel: string | undefined, }