"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import type { BetAccount, HouseName, MovementType } from "@/lib/bets/types";
import { getTypeLabel, parseBRL, parseHouseName, todayInputDate } from "@/lib/bets/utils";

type Props = {
  accounts: BetAccount[];
  reload: () => Promise<void>;
};

export function useBetsActions({ accounts, reload }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formHouse, setFormHouse] = useState<HouseName>("Bet365");
  const [formType, setFormType] = useState<MovementType>("profit");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(todayInputDate());
  const [saving, setSaving] = useState(false);

  async function getOrCreateAccount(house: HouseName) {
    const existing = accounts.find((item) => parseHouseName(item.name) === house);

    if (existing) return existing;

    const { data, error } = await supabase
      .from("bet_accounts")
      .insert({
        name: house,
        balance: 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    return data as BetAccount;
  }

  function resetForm() {
    setModalOpen(false);
    setFormAmount("");
    setFormType("profit");
    setFormHouse("Bet365");
    setFormDate(todayInputDate());
  }

  async function saveMovement() {
    const amount = parseBRL(formAmount);

    if (!amount || amount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    try {
      setSaving(true);

      const account = await getOrCreateAccount(formHouse);
      const currentBalance = Number(account.balance ?? 0);

      if (formType === "base") {
        const { error } = await supabase
          .from("bet_accounts")
          .update({ balance: amount })
          .eq("id", account.id);

        if (error) throw error;

        resetForm();
        await reload();
        return;
      }

      const nextBalance =
        formType === "deposit" || formType === "profit"
          ? currentBalance + amount
          : currentBalance - amount;

      const { error: accountError } = await supabase
        .from("bet_accounts")
        .update({ balance: nextBalance })
        .eq("id", account.id);

      if (accountError) throw accountError;

      const transactionPayload = {
        type:
          formType === "deposit"
            ? "deposit"
            : formType === "profit"
              ? "profit"
              : formType === "loss"
                ? "loss"
                : "withdraw",
        from_account: formType === "withdraw" || formType === "loss" ? formHouse : null,
        to_account: formType === "deposit" || formType === "profit" ? formHouse : null,
        amount,
        description: getTypeLabel(formType),
        created_at: `${formDate}T12:00:00`,
      };

      const { error: transactionError } = await supabase
        .from("bet_transactions")
        .insert(transactionPayload);

      if (transactionError) {
        alert(transactionError.message);
        return;
      }

      resetForm();
      await reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar movimentação.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovement(id: string) {
    const confirmed = confirm("Deseja excluir essa movimentação?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("bet_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await reload();
  }

  return {
    modalOpen,
    setModalOpen,
    formHouse,
    setFormHouse,
    formType,
    setFormType,
    formAmount,
    setFormAmount,
    formDate,
    setFormDate,
    saving,
    saveMovement,
    deleteMovement,
  };
}
