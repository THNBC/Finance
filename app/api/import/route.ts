import { NextResponse } from "next/server";
import { saveImport } from "@/lib/import/saveImport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const payload = JSON.parse(text);

    const result = await saveImport(payload);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao importar arquivo.",
        details: String(error),
      },
      { status: 500 }
    );
  }
}