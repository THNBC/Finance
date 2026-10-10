export type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  card_id: string | null;
  created_at: string;
  credit_cards?: {
    name: string;
  }[];
};

export type TransactionItem = {
  id: string;
  transaction_id: string;
  item_date: string | null;
  description: string;
  amount: number;
  installment: string | null;
  created_at: string;
  item_type: "credit_card" | "income";
};

export type CreditCardRow = {
  id: string;
  name: string;
  active: boolean;
};

export type CreditCardInstallment = {
  id: string;
  purchase_id: string;
  card_id: string;
  description: string | null;
  installment_number: number;
  installment_total: number;
  due_month: number;
  due_year: number;
  due_date: string;
  amount: number;
  paid: boolean | null;
  payment_date: string | null;
};

export type TransactionTypeFilter = "all" | "income" | "expense";

export type TransactionSourceFilter =
  | "all"
  | "caixa"
  | "inter"
  | "mercadopago"
  | "manual";
