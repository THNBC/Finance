"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AccountsPanel } from "@/components/cartoes/AccountsPanel";
import { CartoesHeader } from "@/components/cartoes/CartoesHeader";
import { CartoesModals } from "@/components/cartoes/CartoesModals";
import { CreditCardsPanel } from "@/components/cartoes/CreditCardsPanel";
import { InvestmentsChartPanel } from "@/components/cartoes/InvestmentsChartPanel";
import { InvestmentsPanel } from "@/components/cartoes/InvestmentsPanel";
import { TopCardsGrid } from "@/components/cartoes/TopCardsGrid";
import { useCartoesActions } from "@/hooks/cartoes/useCartoesActions";
import { useCartoesData } from "@/hooks/cartoes/useCartoesData";

export default function CartoesPage() {
  const {
    loading,
    transactions,
    accounts,
    cards,
    purchases,
    investments,
    investmentTransactions,
    data,
    loadData,
  } = useCartoesData();

  const actions = useCartoesActions({
    accounts,
    cards,
    purchases,
    investments,
    data,
    reload: loadData,
  });

  const [chartMonths, setChartMonths] = useState<3 | 6 | 12>(6);

  return (
    <main className="min-h-screen">
      <section className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <CartoesHeader
          onAddTransaction={() => actions.setShowTransactionModal(true)}
        />

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <TopCardsGrid data={data} />

            <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
              <div className="flex flex-col gap-5 xl:col-span-6">
                <AccountsPanel
                  data={data}
                  onEditBalance={actions.openBalanceModal}
                />

                <InvestmentsPanel
                  investments={investments}
                  data={data}
                  onAddInvestment={() => actions.setShowInvestmentModal(true)}
                />
              </div>

              <div className="flex xl:col-span-6">
                <CreditCardsPanel
                  data={data}
                  onAddPurchase={actions.openPurchaseModal}
                  onSelectInvoice={actions.setSelectedInvoice}
                />
              </div>

              <div className="xl:col-span-12">
                <InvestmentsChartPanel
                  investmentTransactions={investmentTransactions}
                  transactions={transactions}
                  chartMonths={chartMonths}
                  onChartMonthsChange={setChartMonths}
                />
              </div>
            </section>
          </>
        )}
      </section>

      <CartoesModals
        actions={actions}
        cards={cards}
        investments={investments}
      />
    </main>
  );
}