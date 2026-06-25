export type ImportStatus = "idle" | "selected" | "reading" | "ready" | "error";

export type ImportSource = "caixa" | "inter" | "mercadopago" | string;

export type ImportItem = {
  date: string;
  description: string;
  amount: number;
  installment?: string | null;
};

export type ImportedTransaction = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: ImportSource;
  group_type?: "credit_card_invoice" | "income_group" | null;
  items?: ImportItem[];
};

export type ImportFile = {
  version: number;
  period?: {
    month: number;
    year: number;
    label: string;
  };
  currency?: string;
  transactions: ImportedTransaction[];
  ignored?: {
    date: string;
    description: string;
    amount: number;
    source: string;
    reason: string;
  }[];
};

export type ManualForm = {
  type: "income" | "expense";
};

export type ManualLine = {
  date: string;
  description: string;
  amount: string;
  installment: string;
  source: "caixa" | "inter" | "mercadopago";
};

export type ImportResult = {
  savedCount: number;
  duplicateCount: number;
  itemCount: number;
  invoicePaymentIgnoredCount: number;
};