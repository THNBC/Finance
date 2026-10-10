export type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  created_at: string;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
  active?: boolean;
};

export type DashboardPeriod = 3 | 6 | 12;

export type ChartMonth = {
  key: string;
  month: string;
  income: number;
  expense: number;
};

export type BalanceChartItem = {
  month: string;
  balance: number;
};

export type MonthlyChartItem = {
  month: string;
  income: number;
  expense: number;
};

export type DashboardData = {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
  lastImport: string;
  balanceChartData: BalanceChartItem[];
  monthlyChartData: MonthlyChartItem[];
  recentImports: Transaction[];
};
