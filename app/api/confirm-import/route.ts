import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { transactions } = await request.json();

    if (!transactions?.length) {
      return NextResponse.json(
        { error: "Nenhuma transação para salvar." },
        { status: 400 }
      );
    }

    let savedCount = 0;
    let duplicateCount = 0;
    let invoicePaymentIgnoredCount = 0;
    let paidInvoicesCount = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);

      const { data: duplicatedTransaction } = await supabase
        .from("transactions")
        .select("id")
        .eq("transaction_date", transaction.date)
        .eq("description", transaction.description)
        .eq("amount", amount)
        .eq("source", transaction.source ?? null)
        .maybeSingle();

      if (duplicatedTransaction) {
        duplicateCount++;
        continue;
      }

      if (transaction.source === "caixa" && transaction.type === "expense") {
        const description = String(transaction.description ?? "").toLowerCase();

        let invoiceSources: string[] = [];

        if (
          description.includes("mercado pago") ||
          description.includes("mercadopago")
        ) {
          invoiceSources = ["mercadopago"];
        }

        if (
          description.includes("inter") ||
          description.includes("banco inter")
        ) {
          invoiceSources = ["inter"];
        }

        if (invoiceSources.length > 0) {
          const { data: existingInvoice } = await supabase
            .from("transactions")
            .select("id, paid")
            .eq("type", "expense")
            .in("source", invoiceSources)
            .eq("amount", amount)
            .maybeSingle();

          if (existingInvoice) {
            if (!existingInvoice.paid) {
              const { error: paidError } = await supabase
                .from("transactions")
                .update({ paid: true })
                .eq("id", existingInvoice.id);

              if (paidError) throw paidError;

              paidInvoicesCount++;
            }

            invoicePaymentIgnoredCount++;
            continue;
          }
        }
      }

      const { data: card } = await supabase
        .from("credit_cards")
        .select("id")
        .eq("name", transaction.cardName)
        .maybeSingle();

      const { data: savedTransaction, error: transactionError } =
        await supabase
          .from("transactions")
          .insert({
            transaction_date: transaction.date,
            description: transaction.description,
            amount,
            type: transaction.type,
            card_id: card?.id ?? null,
            source: transaction.source ?? null,
            paid: false,
          })
          .select("id")
          .single();

      if (transactionError) throw transactionError;

      savedCount++;

      if (transaction.items?.length) {
        const itemsToInsert = transaction.items.map((item: any) => ({
          transaction_id: savedTransaction.id,
          item_date: item.date || null,
          description: item.description,
          amount: Number(item.amount),
          installment: item.installment ?? null,
        }));

        const { error: itemsError } = await supabase
          .from("credit_card_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
    }

    return NextResponse.json({
      success: true,
      savedCount,
      duplicateCount,
      invoicePaymentIgnoredCount,
      paidInvoicesCount,
      ignoredCount: duplicateCount + invoicePaymentIgnoredCount,
    });
  } catch (error: any) {
    console.error("Erro ao confirmar importação:", error);

    return NextResponse.json(
      {
        error: error?.message ?? "Erro desconhecido",
        details: error,
      },
      { status: 500 }
    );
  }
}