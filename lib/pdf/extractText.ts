export async function extractText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc =
    "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjs.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    const content = await page.getTextContent();

    const pageText = content.items
      .map((item: any) => item.str ?? "")
      .join(" ");

    text += pageText + "\n";
  }

  return text;
}