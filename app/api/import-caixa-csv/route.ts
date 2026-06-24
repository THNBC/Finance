import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseBRL(value: string) {
    return Number(
        value
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .replace(/[^\d.-]/g, "")
            .trim()
    );
}

function getMonthName(month: number) {
    const months = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];

    return months[month - 1];
}

function getType(history: string): "income" | "expense" | null {
    const text = history.toUpperCase();

    if (
        text.includes("PIX RECEBIDO") ||
        text.includes("CR CONV SAQ DEP-JAM FGTS")
    ) {
        return "income";
    }

    if (text.includes("PIX ENVIADO") || text.includes("CLARO RESIDENCIAL")) {
        return "expense";
    }

    return null;
}

function shouldIgnore(history: string) {
    const text = history.toUpperCase();

    return text.includes("SALDO DIA") || text.includes("SALDO ANTERIOR");
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Arquivo não enviado." },
                { status: 400 }
            );
        }

        const csvText = await file.text();
        console.log("CSV LENGTH:", csvText.length);

        const lines = csvText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        console.log("LINES:", lines.length);
        console.log("FIRST LINE:", lines[0]);
        const transactions: any[] = [];
        const groupedRendimentos: Record<
            string,
            {
                year: string;
                month: string;
                total: number;
                items: {
                    date: string;
                    description: string;
                    amount: number;
                }[];
            }
        > = {};

        for (const line of lines) {
            console.log("LINE:", line);
            if (shouldIgnore(line)) continue;

            const dateMatch = line.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!dateMatch) continue;

            const [, day, month, year] = dateMatch;

            const valueMatch = line.match(
                /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD])\b/i
            );
            if (!valueMatch) {
                console.log("SEM VALOR:", line);
                continue;
            }
            if (!valueMatch) continue;

            const amount = parseBRL(valueMatch[1]);
            const signal = valueMatch[2].toUpperCase();

            const parts = line
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean);

            const operationIndex = parts.findIndex((part) =>
                [
                    "PIX ENVIADO",
                    "PIX RECEBIDO",
                    "CREDITO JUROS",
                    "CORRECAO MONETARIA",
                    "CLARO RESIDENCIAL",
                    "CR CONV SAQ DEP-JAM FGTS",
                ].some((key) => part.toUpperCase().includes(key))
            );

            let history = line;

            if (operationIndex >= 0) {
                const operation = parts[operationIndex];
                const person = parts[operationIndex + 1];

                history =
                    person &&
                        !person.includes("C") &&
                        !person.includes("D") &&
                        person.trim() !== ""
                        ? `${operation} - ${person}`
                        : operation;
            }

            const upperHistory = history.toUpperCase();
            const formattedDate = `${year}-${month}-${day}`;

            if (
                upperHistory.includes("CREDITO JUROS") ||
                upperHistory.includes("CORRECAO MONETARIA")
            ) {
                const monthKey = `${year}-${month}`;

                if (!groupedRendimentos[monthKey]) {
                    groupedRendimentos[monthKey] = {
                        year,
                        month,
                        total: 0,
                        items: [],
                    };
                }

                groupedRendimentos[monthKey].total += Math.abs(amount);
                groupedRendimentos[monthKey].items.push({
                    date: formattedDate,
                    description: history,
                    amount: Math.abs(amount),
                });

                continue;
            }

            let type = getType(history);

            if (!type) {
                type = signal === "C" ? "income" : "expense";
            }

            transactions.push({
                date: formattedDate,
                description: history,
                amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
                type,
                source: "caixa",
            });
        }

        for (const group of Object.values(groupedRendimentos)) {
            transactions.push({
                date: `${group.year}-${group.month}-18`,
                description: `Rendimento Caixa ${getMonthName(
                    Number(group.month)
                )}/${group.year}`,
                amount: Math.abs(group.total),
                type: "income",
                source: "caixa",
                items: group.items,
            });
        }

        transactions.sort((a, b) => b.date.localeCompare(a.date));

        console.log("================================");
        console.log("TRANSAÇÕES CAIXA");
        console.log("TOTAL CAIXA:", transactions.length);
        console.log(JSON.stringify(transactions, null, 2));
        console.log("================================");

        return NextResponse.json({
            text: csvText,
            source: "caixa",
            transactions,
        });
    } catch (error) {
        console.error("Erro ao importar CSV Caixa:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro ao importar CSV Caixa.",
            },
            { status: 500 }
        );
    }
}