export type Transaction = {
  id: string;
  transaction_date: string;
  description: string | null;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  paid: boolean | null;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
  active: boolean;
};

export type CreditCardRow = {
  id: string;
  name: string;
  limit_total: number;
  active: boolean;
};

export type CreditCardPurchase = {
  id: string;
  card_id: string;
  description: string;
  purchase_date: string;
  total_amount: number;
  installments: number;
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

export type InvoiceItem = {
  id: string;
  purchase_id: string;
  description: string;
  amount: number;
  installmentLabel: string;
  purchaseDate: string;
};

export type InvoiceRow = {
  id: string;
  key: string;
  label: string;
  month: number;
  year: number;
  total: number;
  items: InvoiceItem[];
};

export type SelectedInvoice = {
  invoice: InvoiceRow;
  cardName: string;
  canPay: boolean;
};

export type Investment = {
  id: string;
  name: string;
  description: string;
  amount: number;
  profit: number;
};

export type InvestmentTransaction = {
  id: string;
  investment_id: string;
  type: "aporte" | "rendimento" | "saque";
  amount: number;
  transaction_date: string;
};

export type CardViewRow = {
  id: string;
  name: string;
  source: string;
  limit: number;
  used: number;
  available: number;
  percent: number;
  currentInvoice: InvoiceRow | null;
  nextInvoices: InvoiceRow[];
  openInvoices: InvoiceRow[];
  icon: string;
  subtitle: string;
  barClass: string;
  invoiceHoverClass: string;
};

export type CartoesData = {
  caixaBalance: number;
  caixaProfit: number;
  transactionsBalance: number;
  cardRows: CardViewRow[];
  totalLimit: number;
  totalUsed: number;
  totalInvoices: number;
  availableLimit: number;
  totalInvested: number;
  totalProfit: number;
  profitability: number;
  totalGeneral: number;
};