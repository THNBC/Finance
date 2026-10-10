"use client";

import {
  ArrowDown,
  ArrowUp,
  LineChart,
  Loader2,
  Plus,
  Wallet,
} from "lucide-react";

import { HouseBalancesPanel } from "@/components/bets/HouseBalancesPanel";
import { MovementModal } from "@/components/bets/modals/MovementModal";
import { MovementsPanel } from "@/components/bets/MovementsPanel";
import { PerformanceChartPanel } from "@/components/bets/PerformanceChartPanel";
import { TopCard } from "@/components/bets/TopCard";
import { useBetsActions } from "@/hooks/bets/useBetsActions";
import { useBetsData } from "@/hooks/bets/useBetsData";
import { formatBRL, getMonthComparison } from "@/lib/bets/utils";

export default function BetsPage() {
  const {
    accounts,
    loading,
    chartRange,
    setChartRange,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    data,
    loadData,
  } = useBetsData();

  const actions = useBetsActions({
    accounts,
    reload: loadData,
  });

  return (
    <main className="min-h-screen w-full text-white">
      <section className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Bets
            </h2>

            <p className="mt-1 hidden text-sm text-zinc-500 lg:block">
              Acompanhe seus resultados e controle suas apostas.
            </p>
          </div>

          <button
            onClick={() => actions.setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 sm:w-auto"
          >
            <Plus size={18} />
            Adicionar movimentação
          </button>
        </header>

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Carregando bets...
          </div>
        ) : (
          <>
            <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TopCard
                title="Saldo nas casas"
                value={formatBRL(data.totalBalance)}
                helper="Soma do saldo disponível"
                icon={<Wallet size={25} />}
                variant="green"
              />

              <TopCard
                title="Total depositado"
                value={formatBRL(data.totalDeposited)}
                helper={getMonthComparison(
                  data.totalDeposited,
                  data.previousDeposited
                )}
                icon={<ArrowDown size={25} />}
                variant="red"
              />

              <TopCard
                title="Total sacado"
                value={formatBRL(data.totalWithdrawn)}
                helper={getMonthComparison(
                  data.totalWithdrawn,
                  data.previousWithdrawn
                )}
                icon={<ArrowUp size={25} />}
                variant="green"
              />

              <TopCard
                title="Resultado do mês"
                value={formatBRL(data.monthResult)}
                helper={getMonthComparison(
                  data.monthResult,
                  data.previousMonthResult
                )}
                icon={<LineChart size={25} />}
                variant={data.monthResult >= 0 ? "purple" : "red"}
              />
            </section>

            <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[520px_1fr]">
              <HouseBalancesPanel
                accounts={data.visibleAccounts}
                totalBalance={data.totalBalance}
              />

              <PerformanceChartPanel
                chartRange={chartRange}
                onChartRangeChange={setChartRange}
                data={data.performanceData}
              />
            </section>

            <section>
              <MovementsPanel
                movements={data.paginatedTransactions}
                totalMovements={data.recentTransactions.length}
                safePage={data.safePage}
                totalPages={data.totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
                onDeleteMovement={actions.deleteMovement}
              />
            </section>
          </>
        )}
      </section>

      <MovementModal
        open={actions.modalOpen}
        saving={actions.saving}
        house={actions.formHouse}
        type={actions.formType}
        date={actions.formDate}
        amount={actions.formAmount}
        onClose={() => actions.setModalOpen(false)}
        onHouseChange={actions.setFormHouse}
        onTypeChange={actions.setFormType}
        onDateChange={actions.setFormDate}
        onAmountChange={actions.setFormAmount}
        onSave={actions.saveMovement}
      />
    </main>
  );
}