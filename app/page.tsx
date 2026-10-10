"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useDashboardActions } from "@/hooks/dashboard/useDashboardActions";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import type { DashboardPeriod } from "@/lib/dashboard/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>(6);

  const { loading, dashboardData, loadDashboard } = useDashboardData(period);

  const actions = useDashboardActions({
    reload: loadDashboard,
  });

  return (
    <main className="min-h-screen">
      <section className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <DashboardHeader
          onAddTransaction={() => actions.setShowTransactionModal(true)}
        />

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Carregando dashboard...
          </div>
        ) : (
          <>
            <SummaryCards data={dashboardData} />

            <DashboardCharts
              data={dashboardData}
              period={period}
              onPeriodChange={setPeriod}
            />

            <RecentTransactions
              transactions={dashboardData.recentImports}
              onAddTransaction={() => actions.setShowTransactionModal(true)}
            />
          </>
        )}
      </section>

      <AddTransactionModal
        open={actions.showTransactionModal}
        saving={actions.savingTransaction}
        type={actions.transactionType}
        description={actions.transactionDescription}
        amount={actions.transactionAmount}
        date={actions.transactionDate}
        onClose={() => actions.setShowTransactionModal(false)}
        onTypeChange={actions.setTransactionType}
        onDescriptionChange={actions.setTransactionDescription}
        onAmountChange={actions.setTransactionAmount}
        onDateChange={actions.setTransactionDate}
        onSave={actions.saveManualTransaction}
      />
    </main>
  );
}
