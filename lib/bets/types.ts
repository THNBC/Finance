export type HouseName = "Bet365" | "Betano" | "Superbet";
export type MovementType = "base" | "deposit" | "profit" | "loss" | "withdraw";
export type ChartRange = 3 | 6 | 12;

export type BetAccount = {
  id: string;
  name: string;
  balance: number | null;
};

export type BetTransaction = {
  id: string;
  type: string;
  from_account: string | null;
  to_account: string | null;
  amount: number;
  created_at: string;
  description?: string | null;
};

export type ChartRow = {
  month: string;
  Bet365: number;
  Betano: number;
  Superbet: number;
};

export type VisibleBetAccount = {
  id: string;
  name: HouseName;
  balance: number;
};

export type RecentBetTransaction = BetTransaction & {
  house: HouseName | null;
  displayAmount: number;
};
