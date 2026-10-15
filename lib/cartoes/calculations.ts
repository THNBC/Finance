import type {
  Account,
  CartoesData,
  CreditCardInstallment,
  CreditCardPurchase,
  CreditCardRow,
  Investment,
  InvoiceRow,
  Transaction,
} from "./types";

import {
  getCardSource,
  getIcon,
  getInvoiceHoverClass,
  getLimitBarClass,
  getMonthLabel,
  isCaixaProfitTransaction,
  toMonthInputValue,
} from "./utils";

export function calculateCartoesData({
  accounts,
  transactions,
  cards,
  purchases,
  installments,
  investments,
}: {
  accounts: Account[];
  transactions: Transaction[];
  cards: CreditCardRow[];
  purchases: CreditCardPurchase[];
  installments: CreditCardInstallment[];
  investments: Investment[];
}): CartoesData {
  const initialAccountBalance = accounts.reduce(
    (sum, account) =>
      account.active === false
        ? sum
        : sum + Number(account.balance ?? 0),
    0
  );

  const caixaTransactions = transactions.filter(
    (transaction) => transaction.source === "caixa"
  );

  const transactionsBalance = caixaTransactions.reduce(
    (sum, transaction) =>
      sum + Number(transaction.amount ?? 0),
    0
  );

  const caixaBalance =
    initialAccountBalance + transactionsBalance;

  const currentInvoiceKey =
    toMonthInputValue(new Date());

  const caixaProfit = transactions
    .filter(isCaixaProfitTransaction)
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount ?? 0),
      0
    );

  const purchasesById = new Map(
    purchases.map((purchase) => [
      purchase.id,
      purchase,
    ])
  );

  const cardRows = cards
    .filter((card) => card.active !== false)
    .map((card) => {
      const source = getCardSource(card.name);

      const cardInstallments = installments.filter(
        (installment) =>
          installment.card_id === card.id
      );

      const openInstallments =
        cardInstallments.filter(
          (installment) =>
            installment.paid !== true
        );

      const invoiceMap =
        new Map<string, InvoiceRow>();

      for (const installment of openInstallments) {
        const key = `${installment.due_year}-${String(
          installment.due_month
        ).padStart(2, "0")}`;

        const invoiceDate = new Date(
          installment.due_year,
          installment.due_month - 1,
          1
        );

        const currentInvoice =
          invoiceMap.get(key) ?? {
            id: `${card.id}-${key}`,
            key,
            label: `${getMonthLabel(
              invoiceDate.getMonth()
            )}/${invoiceDate.getFullYear()}`,
            month: installment.due_month,
            year: installment.due_year,
            total: 0,
            items: [],
          };

        const purchase = purchasesById.get(
          installment.purchase_id
        );

        currentInvoice.total += Math.abs(
          Number(installment.amount ?? 0)
        );

        currentInvoice.items.push({
          id: installment.id,
          purchase_id: installment.purchase_id,
          description:
            installment.description ??
            purchase?.description ??
            "Compra",
          amount: Math.abs(
            Number(installment.amount ?? 0)
          ),
          installmentLabel: `${installment.installment_number}/${installment.installment_total}`,
          purchaseDate:
            purchase?.purchase_date ?? "",
        });

        invoiceMap.set(
          key,
          currentInvoice
        );
      }

      const openInvoices = Array.from(
        invoiceMap.values()
      ).sort((a, b) =>
        a.key.localeCompare(b.key)
      );

      const currentInvoice =
        openInvoices.find(
          (invoice) =>
            invoice.key === currentInvoiceKey
        ) ?? null;

      const nextInvoices = openInvoices
        .filter(
          (invoice) =>
            invoice.key > currentInvoiceKey
        )
        .slice(0, 1);

      const used =
        openInstallments.reduce(
          (sum, installment) =>
            sum +
            Math.abs(
              Number(
                installment.amount ?? 0
              )
            ),
          0
        );

      const limit =
        Number(card.limit_total ?? 0);

      const available =
        Math.max(limit - used, 0);

      const percent =
        limit > 0
          ? Math.min(
            (used / limit) * 100,
            100
          )
          : 0;

      return {
        id: card.id,
        name: card.name,
        source,
        limit,
        used,
        available,
        percent,
        currentInvoice,
        nextInvoices,
        openInvoices,
        icon: getIcon(source),
        subtitle:
          source === "inter"
            ? "Cartão Inter"
            : source ===
              "mercadopago"
              ? "Cartão Mercado Pago"
              : "Cartão",
        barClass:
          getLimitBarClass(
            percent,
            source
          ),
        invoiceHoverClass:
          getInvoiceHoverClass(source),
      };
    });

  const totalLimit = cardRows.reduce(
    (sum, card) =>
      sum + card.limit,
    0
  );

  const totalUsed = cardRows.reduce(
    (sum, card) =>
      sum + card.used,
    0
  );

  const totalInvoices =
    cardRows.reduce(
      (sum, card) =>
        sum +
        (card.currentInvoice?.total ?? 0),
      0
    );

  const availableLimit =
    Math.max(
      totalLimit - totalUsed,
      0
    );

  const totalInvestmentBase =
    investments.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );

  const totalProfit =
    investments.reduce(
      (sum, item) =>
        sum + Number(item.profit),
      0
    );

  const totalInvested =
    totalInvestmentBase +
    totalProfit;

  const profitability =
    totalInvestmentBase > 0
      ? (totalProfit /
        totalInvestmentBase) *
      100
      : 0;

  return {
    caixaBalance,
    caixaProfit,
    transactionsBalance,
    cardRows,
    totalLimit,
    totalUsed,
    totalInvoices,
    availableLimit,
    totalInvested,
    totalProfit,
    profitability,
    totalGeneral:
      caixaBalance +
      totalInvested,
  };
}