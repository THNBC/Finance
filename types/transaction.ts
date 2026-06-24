// types/transaction.ts

export type ImportedCardItem = {
  date: string;
  description: string;
  amount: number;
  installment?: string;
};

export type ImportedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";

  source?: string;
  invoiceMonth?: number;
  invoiceYear?: number;
  cardName?: string;

  items?: ImportedCardItem[];
};