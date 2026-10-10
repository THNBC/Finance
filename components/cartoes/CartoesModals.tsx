"use client";

import { AddTransactionModal } from "@/components/cartoes/modals/AddTransactionModal";
import { EditBalanceModal } from "@/components/cartoes/modals/EditBalanceModal";
import { InvestmentModal } from "@/components/cartoes/modals/InvestmentModal";
import { InvoiceDetailsModal } from "@/components/cartoes/modals/InvoiceDetailsModal";
import { PayInvoiceModal } from "@/components/cartoes/modals/PayInvoiceModal";
import { PurchaseModal } from "@/components/cartoes/modals/PurchaseModal";
import type { CreditCardRow, Investment } from "@/lib/cartoes/types";
import type { useCartoesActions } from "@/hooks/cartoes/useCartoesActions";

type CartoesActions = ReturnType<typeof useCartoesActions>;

export function CartoesModals({
  actions,
  cards,
  investments,
}: {
  actions: CartoesActions;
  cards: CreditCardRow[];
  investments: Investment[];
}) {
  return (
    <>
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

      <EditBalanceModal
        open={actions.showBalanceModal}
        saving={actions.savingBalance}
        value={actions.balanceValue}
        onChange={actions.setBalanceValue}
        onClose={() => actions.setShowBalanceModal(false)}
        onSave={actions.saveBalance}
      />

      <InvoiceDetailsModal
        selectedInvoice={actions.selectedInvoice}
        payingInvoiceId={actions.payingInvoiceId}
        deletingPurchaseId={actions.deletingPurchaseId}
        onClose={() => actions.setSelectedInvoice(null)}
        onPayClick={(invoice) => {
          actions.setInvoiceToPay(invoice);
          actions.setSelectedInvoice(null);
        }}
        onEditPurchase={actions.openEditPurchase}
        onDeletePurchase={actions.deletePurchase}
      />

      <PayInvoiceModal
        invoiceToPay={actions.invoiceToPay}
        payingInvoiceId={actions.payingInvoiceId}
        onClose={() => actions.setInvoiceToPay(null)}
        onPay={(invoice) =>
          actions.payInvoice(invoice.invoice, invoice.cardName)
        }
      />

      <PurchaseModal
        open={actions.showPurchaseModal}
        saving={actions.savingPurchase}
        editing={Boolean(actions.editingPurchaseId)}
        cards={cards}
        cardId={actions.purchaseCardId}
        description={actions.purchaseDescription}
        amount={actions.purchaseAmount}
        installments={actions.purchaseInstallments}
        date={actions.purchaseDate}
        onClose={() => actions.setShowPurchaseModal(false)}
        onCardChange={actions.setPurchaseCardId}
        onDescriptionChange={actions.setPurchaseDescription}
        onAmountChange={actions.setPurchaseAmount}
        onInstallmentsChange={actions.setPurchaseInstallments}
        onDateChange={actions.setPurchaseDate}
        onSave={actions.savePurchase}
      />

      <InvestmentModal
        open={actions.showInvestmentModal}
        saving={actions.savingInvestment}
        investments={investments}
        investmentId={actions.investmentId}
        type={actions.investmentType}
        amount={actions.investmentAmount}
        date={actions.investmentDate}
        onClose={() => actions.setShowInvestmentModal(false)}
        onInvestmentChange={(value) => {
          actions.setInvestmentId(value);

          if (value === "caixa") {
            actions.setInvestmentType("rendimento");
          }
        }}
        onTypeChange={actions.setInvestmentType}
        onAmountChange={actions.setInvestmentAmount}
        onDateChange={actions.setInvestmentDate}
        onSave={actions.saveInvestmentTransaction}
      />
    </>
  );
}