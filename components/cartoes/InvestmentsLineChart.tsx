
"use client";

import {
  CartesianGrid,
  Curve,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Transaction = {
  transaction_date: string;
  description: string | null;
  amount: number;
  type: "income" | "expense";
  source: string | null;
};

type InvestmentTransaction = {
  investment_id: string;
  type: "aporte" | "rendimento" | "saque";
  amount: number;
  transaction_date: string;
};

type InvestmentsLineChartProps = {
  investmentTransactions: InvestmentTransaction[];
  transactions: Transaction[];
  monthsToShow: number;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatAxisValue(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }

  return String(Math.round(value));
}

function getMonthLabel(monthIndex: number) {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  return months[monthIndex] ?? "";
}

function isCaixaProfitTransaction(transaction: Transaction) {
  if (transaction.source !== "caixa") return false;
  if (transaction.type !== "income") return false;

  const description = (transaction.description ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    description.includes("rendimento") ||
    description.includes("credito juros") ||
    description.includes("correcao monetaria")
  );
}

function buildInvestmentEvolution(
  investmentTransactions: InvestmentTransaction[],
  transactions: Transaction[],
  monthsToShow: number,
) {
  const now = new Date();

  const months = Array.from({ length: monthsToShow }).map((_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (monthsToShow - 1 - index),
      1,
    );

    return {
      label: getMonthLabel(date.getMonth()),
      monthIndex: date.getMonth(),
      year: date.getFullYear(),
    };
  });

  return months.map((monthData) => {
    const monthInvestmentTransactions = investmentTransactions.filter(
      (transaction) => {
        const date = new Date(
          `${transaction.transaction_date}T12:00:00`,
        );

        return (
          date.getFullYear() === monthData.year &&
          date.getMonth() === monthData.monthIndex
        );
      },
    );

    const monthCaixaProfitTransactions = transactions.filter(
      (transaction) => {
        const date = new Date(
          `${transaction.transaction_date}T12:00:00`,
        );

        return (
          date.getFullYear() === monthData.year &&
          date.getMonth() === monthData.monthIndex &&
          isCaixaProfitTransaction(transaction)
        );
      },
    );

    let cdi = 0;
    let porquinhoBets = 0;

    for (const transaction of monthInvestmentTransactions) {
      const amount = Number(transaction.amount ?? 0);

      if (transaction.type === "rendimento") {
        if (transaction.investment_id === "cdi") {
          cdi += amount;
        }

        if (transaction.investment_id === "porquinho-bets") {
          porquinhoBets += amount;
        }
      }

      if (transaction.type === "saque") {
        if (transaction.investment_id === "cdi") {
          cdi -= amount;
        }

        if (transaction.investment_id === "porquinho-bets") {
          porquinhoBets -= amount;
        }
      }
    }

    const caixa = monthCaixaProfitTransactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount ?? 0),
      0,
    );

    return {
      month: monthData.label,
      cdi,
      porquinhoBets,
      caixa,
    };
  });
}

export function InvestmentsLineChart({
  investmentTransactions,
  transactions,
  monthsToShow,
}: InvestmentsLineChartProps) {
  const data = buildInvestmentEvolution(
    investmentTransactions,
    transactions,
    monthsToShow,
  );

  return (
    <div className="h-[270px] sm:h-[340px] lg:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 12,
            right: 4,
            left: -18,
            bottom: 4,
          }}
        >
          <CartesianGrid
            stroke="#1f2937"
            strokeDasharray="4 4"
          />

          <XAxis
            dataKey="month"
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />

          <YAxis
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            width={55}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              formatAxisValue(Number(value))
            }
          />



          <Tooltip
            contentStyle={{
              backgroundColor: "#081018",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              fontSize: "12px",
              padding: "12px 14px",
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: 600,
              marginBottom: "8px",
            }}
            itemStyle={{
              padding: "3px 0",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              <span
                style={{
                  color: Number(value) < 0 ? "#ef4444" : "inherit",
                }}
              >
                {formatBRL(Number(value))}
              </span>,
              name,
            ]}
            cursor={{
              stroke: "#64748b",
              strokeDasharray: "4 4",
            }}
          />


          <Legend
            wrapperStyle={{
              fontSize: "12px",
            }}
          />

          <Line
            type="monotone"
            dataKey="cdi"
            name="CDI"
            stroke="#fb923c"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fb923c" }}
            activeDot={{ r: 6, fill: "#fb923c" }}
            isAnimationActive
            animationDuration={700}
          />

          <Line
            type="monotone"
            dataKey="porquinhoBets"
            name="Porquinho Bets"
            stroke="#34d399"
            strokeWidth={3}
            dot={{ r: 4, fill: "#34d399" }}
            activeDot={{ r: 6, fill: "#34d399" }}
            isAnimationActive
            animationDuration={700}
          />

          <Line
            type="monotone"
            dataKey="caixa"
            name="Caixa"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ r: 4, fill: "#38bdf8" }}
            activeDot={{ r: 6, fill: "#38bdf8" }}
            isAnimationActive
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
