// app/configuracoes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Cloud,
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Loader2,
  Save,
  Shield,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type SystemSettings = {
  id: string;
  app_name: string;
  initial_balance: number;
};

type CardRow = {
  id: string;
  name: string;
  limit_total: number;
  active: boolean;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseBRL(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function toCSV(rows: any[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const escape = (value: any) => {
    if (value === null || value === undefined) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  return [
    headers.join(";"),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(";")),
  ].join("\n");
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [appName, setAppName] = useState("FinanControl");
  const [initialBalance, setInitialBalance] = useState("4130,15");

  const [cards, setCards] = useState<CardRow[]>([]);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [investmentsCount, setInvestmentsCount] = useState(0);
  const [betsCount, setBetsCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [settingsRes, cardsRes, transactionsRes, investmentsRes, betsRes] =
      await Promise.all([
        supabase.from("system_settings").select("*").limit(1).maybeSingle(),
        supabase.from("credit_cards").select("*").order("name"),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("investments").select("id", { count: "exact", head: true }),
        supabase.from("bet_transactions").select("id", { count: "exact", head: true }),
      ]);

    if (settingsRes.data) {
      const data = settingsRes.data as SystemSettings;
      setSettings(data);
      setAppName(data.app_name);
      setInitialBalance(String(data.initial_balance).replace(".", ","));
    }

    if (!cardsRes.error) setCards((cardsRes.data ?? []) as CardRow[]);

    setTransactionsCount(transactionsRes.count ?? 0);
    setInvestmentsCount(investmentsRes.count ?? 0);
    setBetsCount(betsRes.count ?? 0);

    setLoading(false);
  }

  async function saveSettings() {
    const parsedBalance = parseBRL(initialBalance);

    if (Number.isNaN(parsedBalance)) {
      alert("Saldo inicial inválido.");
      return;
    }

    setSaving(true);

    const payload = {
      app_name: appName.trim() || "FinanControl",
      initial_balance: parsedBalance,
    };

    const { error } = settings
      ? await supabase.from("system_settings").update(payload).eq("id", settings.id)
      : await supabase.from("system_settings").insert(payload);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
    alert("Configurações salvas.");
  }

  async function updateCard(cardId: string, limit: string, active: boolean) {
    const parsed = parseBRL(limit);

    if (Number.isNaN(parsed)) {
      alert("Limite inválido.");
      return;
    }

    const { error } = await supabase
      .from("credit_cards")
      .update({
        limit_total: parsed,
        active,
      })
      .eq("id", cardId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
    alert("Cartão atualizado.");
  }

  async function clearTable(table: string, label: string) {
    const confirmed = confirm(`Tem certeza que deseja limpar ${label}?`);
    if (!confirmed) return;

    const { error } = await supabase.from(table).delete().not("id", "is", null);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
    alert(`${label} limpo com sucesso.`);
  }

  async function resetAllData() {
    const confirmed = confirm(
      "Tem certeza que deseja excluir todos os dados? Essa ação não pode ser desfeita."
    );

    if (!confirmed) return;

    const tables = [
      "credit_card_items",
      "investment_transactions",
      "bet_transactions",
      "transactions",
      "investments",
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().not("id", "is", null);

      if (error) {
        alert(`Erro ao limpar ${table}: ${error.message}`);
        return;
      }
    }

    await loadData();
    alert("Todos os dados foram excluídos.");
  }

  async function exportTransactionsCSV() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    downloadFile("transacoes.csv", toCSV(data ?? []), "text/csv;charset=utf-8;");
  }

  async function exportExcel() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    const rows = data ?? [];
    const headers = rows.length ? Object.keys(rows[0]) : [];

    const html = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    downloadFile("dados-financeiros.xls", html, "application/vnd.ms-excel");
  }

  async function generateBackup() {
    const tables = [
      "system_settings",
      "accounts",
      "credit_cards",
      "transactions",
      "credit_card_items",
      "investments",
      "investment_transactions",
      "bet_accounts",
      "bet_transactions",
    ];

    const backup: Record<string, any> = {};

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");

      if (error) {
        backup[table] = {
          error: error.message,
        };
      } else {
        backup[table] = data ?? [];
      }
    }

    downloadFile(
      "backup-financeiro.json",
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8;"
    );
  }

  async function sendPasswordReset() {
    const { data } = await supabase.auth.getUser();

    const email = data.user?.email;

    if (!email) {
      alert("Nenhum usuário logado encontrado.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      alert(error.message);
      return;
    }

    alert("E-mail de alteração de senha enviado.");
  }

  async function signOutAllSessions() {
    const confirmed = confirm("Deseja encerrar as sessões?");
    if (!confirmed) return;

    const { error } = await supabase.auth.signOut({
      scope: "global",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Sessões encerradas.");
  }

  const totalCardLimit = useMemo(() => {
    return cards.reduce((sum, card) => sum + Number(card.limit_total ?? 0), 0);
  }, [cards]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-zinc-500">
        <Loader2 size={22} className="mr-2 animate-spin" />
        Carregando configurações...
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full text-white">
      <section className="w-full px-8 py-7">
        <header className="mb-7">
          <h2 className="text-3xl font-semibold tracking-tight">
            Configurações
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie os dados principais, cartões, segurança, manutenção e backup.
          </p>
        </header>

        <section className="space-y-5">
          <Panel
            icon={<Wallet size={24} />}
            title="Dados do sistema"
            description="Informações principais utilizadas no sistema."
            accent="cyan"
            action={
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salvar alterações
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-5">
              <Field label="Nome do sistema" helper="Nome exibido no painel.">
                <input
                  value={appName}
                  onChange={(event) => setAppName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </Field>

              <Field
                label="Saldo inicial da conta principal (R$)"
                helper="Valor inicial usado como referência."
              >
                <input
                  value={initialBalance}
                  onChange={(event) => setInitialBalance(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </Field>
            </div>
          </Panel>

          <Panel
            icon={<CreditCard size={24} />}
            title="Cartões"
            description="Configure limites e status dos cartões."
            accent="purple"
          >
            <div className="grid grid-cols-2 gap-5">
              {cards.map((card) => (
                <CardConfig key={card.id} card={card} onSave={updateCard} />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-400/20 border-dashed bg-cyan-400/5 px-4 py-4 text-center text-sm font-medium text-cyan-300">
              Limite total dos cartões: {formatBRL(totalCardLimit)}
            </div>
          </Panel>

          <section className="grid grid-cols-2 gap-5">
            <Panel
              icon={<Shield size={24} />}
              title="Segurança"
              description="Gerencie acesso e sessões."
              accent="green"
            >
              <div className="space-y-3">
                <button
                  onClick={sendPasswordReset}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <span>
                    <strong className="block text-sm text-zinc-200">
                      Alterar senha
                    </strong>
                    <span className="text-xs text-zinc-500">
                      Envia um link de redefinição para o e-mail logado.
                    </span>
                  </span>
                  <KeyRound size={17} className="text-zinc-500" />
                </button>

                <button
                  onClick={signOutAllSessions}
                  className="flex w-full items-center justify-between rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-400/20"
                >
                  Encerrar todas as sessões
                  <ChevronRight size={17} />
                </button>
              </div>
            </Panel>

            <Panel
              icon={<Wrench size={24} />}
              title="Manutenção"
              description="Ferramentas para manutenção do sistema."
              accent="orange"
            >
              <div className="space-y-3">
                <MaintenanceRow
                  title="Limpar transações"
                  description={`Remove ${transactionsCount} transações registradas.`}
                  button="Limpar"
                  onClick={() => clearTable("transactions", "as transações")}
                />

                <MaintenanceRow
                  title="Limpar bets"
                  description={`Remove ${betsCount} movimentações de apostas.`}
                  button="Limpar"
                  onClick={() =>
                    clearTable("bet_transactions", "as movimentações bets")
                  }
                />

                <MaintenanceRow
                  title="Limpar investimentos"
                  description={`Remove ${investmentsCount} investimentos cadastrados.`}
                  button="Limpar"
                  onClick={() => clearTable("investments", "os investimentos")}
                />

                <button
                  onClick={resetAllData}
                  className="flex w-full items-center justify-between rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-400/20"
                >
                  <span>
                    <strong className="block">Excluir todos os dados</strong>
                    <span className="text-xs text-red-300/70">
                      Atenção: esta ação não pode ser desfeita.
                    </span>
                  </span>
                  <Trash2 size={17} />
                </button>
              </div>
            </Panel>
          </section>

          <Panel
            icon={<Cloud size={24} />}
            title="Backup e exportação"
            description="Faça backup dos seus dados ou exporte informações."
            accent="cyan"
          >
            <div className="grid grid-cols-3 gap-5">
              <ExportCard
                icon={<FileText size={24} />}
                title="Exportar transações"
                description={`Baixe ${transactionsCount} registros em CSV.`}
                button="Exportar CSV"
                onClick={exportTransactionsCSV}
              />

              <ExportCard
                icon={<FileSpreadsheet size={24} />}
                title="Exportar para Excel"
                description="Baixe um arquivo Excel com as transações."
                button="Exportar Excel"
                onClick={exportExcel}
              />

              <ExportCard
                icon={<Database size={24} />}
                title="Backup completo"
                description="Gere um backup completo em JSON."
                button="Gerar backup"
                onClick={generateBackup}
              />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function Panel({
  icon,
  title,
  description,
  accent,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "cyan" | "purple" | "green" | "orange" | "red";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const accents = {
    cyan: "bg-cyan-400/10 text-cyan-300",
    purple: "bg-purple-400/10 text-purple-300",
    green: "bg-emerald-400/10 text-emerald-300",
    orange: "bg-orange-400/10 text-orange-300",
    red: "bg-red-400/10 text-red-300",
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#081018]/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accents[accent]}`}
          >
            {icon}
          </div>

          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </div>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </span>
      {children}
      <span className="mt-2 block text-xs text-zinc-600">{helper}</span>
    </label>
  );
}

function CardConfig({
  card,
  onSave,
}: {
  card: CardRow;
  onSave: (id: string, value: string, active: boolean) => void;
}) {
  const [limit, setLimit] = useState(String(card.limit_total).replace(".", ","));
  const [active, setActive] = useState(card.active);

  const isInter = card.name.toLowerCase().includes("inter");

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="mb-5 flex items-center justify-between">
        <strong
          className={
            isInter ? "text-3xl text-orange-400" : "text-2xl text-blue-400"
          }
        >
          {card.name}
        </strong>

        <button
          onClick={() => setActive((current) => !current)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            active
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300"
          }`}
        >
          {active ? "Ativo" : "Inativo"}
        </button>
      </div>

      <label>
        <span className="mb-2 block text-sm text-zinc-400">
          Limite do cartão (R$)
        </span>
        <input
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
        />
      </label>

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => onSave(card.id, limit, active)}
          className="rounded-2xl border border-cyan-400/30 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10"
        >
          Salvar cartão
        </button>
      </div>
    </div>
  );
}

function MaintenanceRow({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>

      <button
        onClick={onClick}
        className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
      >
        {button}
      </button>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  button,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 min-h-10 text-sm text-zinc-500">{description}</p>

      <button
        onClick={onClick}
        className="mt-5 flex items-center gap-2 rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10"
      >
        <Download size={15} />
        {button}
      </button>
    </div>
  );
}