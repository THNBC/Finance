import type {
  Account,
  ChartMonth,
  DashboardData,
  DashboardPeriod,
  Transaction,
} from "./types";
import { formatDateBR, getMonthKey, monthNames } from "./utils";

function buildPeriodMonths(period: DashboardPeriod): ChartMonth[] {
  const now = new Date();

  return Array.from({ length: period }).map((_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (period - 1 - index),
      1,
    );

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;

    return {
      key,
      month: monthNames[date.getMonth()],
      income: 0,
      expense: 0,
    };
  });
}

export function buildDashboardData(
  transactions: Transaction[],
  accounts: Account[],
  period: DashboardPeriod,
): DashboardData {
  const sortedTransactions = [...transactions].sort((a, b) =>
    a.transaction_date.localeCompare(b.transaction_date),
  );

  const initialBalance = accounts.reduce((sum, account) => {
    if (account.active === false) return sum;
    return sum + Number(account.balance ?? 0);
  }, 0);

  const caixaTransactions = sortedTransactions.filter(
    (item) => item.source === "caixa",
  );

  const transactionBalance = caixaTransactions.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );

  const currentBalance = initialBalance + transactionBalance;

  const totalIncome = caixaTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

  const totalExpense = caixaTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

  const totalTransactions = caixaTransactions.length;

  const lastTransaction = [...sortedTransactions].sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date),
  )[0];

  const lastImport = lastTransaction
    ? formatDateBR(lastTransaction.transaction_date)
    : "Nenhuma";

  const months = buildPeriodMonths(period);
  const monthlyMap = new Map(months.map((item) => [item.key, item]));

  for (const transaction of caixaTransactions) {
    const key = getMonthKey(transaction.transaction_date);
    const monthData = monthlyMap.get(key);

    if (!monthData) continue;

    const amount = Math.abs(Number(transaction.amount ?? 0));

    if (transaction.type === "income") {
      monthData.income += amount;
    } else {
      monthData.expense += amount;
    }
  }

  
  const balanceChartData = months.map((month) => {
    const monthTransactions = caixaTransactions.filter(
      (transaction) => getMonthKey(transaction.transaction_date) === month.key,
    );

    const monthlyMovement = monthTransactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    );

    return {
      month: month.month,
      balance: monthlyMovement,
    };
  });


  const monthlyChartData = months.map((month) => ({
    month: month.month,
    income: month.income,
    expense: month.expense,
  }));

  const recentImports = [...sortedTransactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 8);

  return {
    currentBalance,
    totalIncome,
    totalExpense,
    totalTransactions,
    lastImport,
    balanceChartData,
    monthlyChartData,
    recentImports,
  };
}
