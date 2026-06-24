import { NextResponse } from "next/server";
import { createCanvas } from "canvas";
import Tesseract from "tesseract.js";

import { parseTransactions } from "@/lib/importers";
import { detectSource } from "@/lib/importers/detectSource";

export const runtime = "nodejs";

async function extractTextWithOcr(buffer: Buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  } as any).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as any,
      viewport,
      canvas: canvas as any,
    }).promise;

    const imageBuffer = canvas.toBuffer("image/png");

    console.log(`OCR página ${pageNumber}/${pdf.numPages}...`);

    const result = await Tesseract.recognize(imageBuffer, "por");

    fullText += "\n" + result.data.text;
  }

  return fullText;
}

export async function POST(request: Request) {
  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await pdfParse(buffer);
    let text = result.text ?? "";

    if (text.trim().length < 50) {
      console.log("PDF sem texto. Iniciando OCR...");
      text = await extractTextWithOcr(buffer);
    }

    const source = detectSource(text);
    const transactions = parseTransactions(text);

    console.log("TEXT LENGTH:", text.length);
    console.log("SOURCE:", source);
    console.log("TRANSACTIONS:", transactions);

    return NextResponse.json({
      text,
      source,
      transactions,
    });
  } catch (error) {
    console.error("Erro ao processar PDF:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar PDF.",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}