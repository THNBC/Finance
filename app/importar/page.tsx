"use client";

import {
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import StatusCard from "@/components/import/StatusCard";
import ImportSummary from "@/components/import/ImportSummary";
import PreviewTable from "@/components/import/PreviewTable";
import { useImport } from "@/hooks/useImport";
import ImportManualModal from "@/components/import/ImportManualModal";
import ImportResultModal from "@/components/import/ImportResultModal";

export default function ImportarPage() {
  const importer = useImport();

  return (
    <main className="min-h-screen w-full text-white">
      <section className="w-full px-8 py-7">
        <header className="mb-7">
          <h2 className="text-3xl font-semibold tracking-tight">
            Importar arquivo
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Envie um JSON padronizado para revisar antes de salvar.
          </p>
        </header>

        <section className="grid grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Upload do arquivo</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    O sistema vai ler o JSON e preparar uma revisão.
                  </p>
                </div>
              </div>

              <input
                ref={importer.inputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) =>
                  importer.handleFile(event.target.files?.[0] ?? null)
                }
              />

              {!importer.file ? (
                <button
                  onClick={() => importer.inputRef.current?.click()}
                  className="flex h-[280px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/10 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                    <Upload size={30} />
                  </div>

                  <p className="text-base font-medium">
                    Clique para selecionar um JSON
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Arquivo padronizado de importação
                  </p>
                </button>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                        <FileText size={26} />
                      </div>

                      <div>
                        <p className="font-medium">{importer.file.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {(importer.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={importer.removeFile}
                      className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <button
                    onClick={importer.readJson}
                    disabled={importer.status === "reading"}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importer.status === "reading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Lendo JSON
                      </>
                    ) : (
                      <>
                        <FileUp size={18} />
                        Ler JSON
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <PreviewTable
              transactions={importer.transactions}
              source={importer.source}
              expandedRow={importer.expandedRow}
              onToggleExpanded={importer.toggleExpandedRow}
              onAddManual={() => importer.openManualModal()}
              onEdit={importer.openManualModal}
              onRemove={importer.removeTransaction}
            />

            {importer.rawText && (
              <details className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
                <summary className="cursor-pointer text-sm text-zinc-400">
                  Ver conteúdo do JSON
                </summary>

                <pre className="mt-4 max-h-[280px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs text-zinc-500">
                  {importer.rawText}
                </pre>
              </details>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
              <h3 className="text-lg font-medium">Status</h3>

              <div className="mt-5 space-y-4">
                <StatusCard
                  active={!!importer.file}
                  done={!!importer.file}
                  title="Arquivo selecionado"
                />

                <StatusCard
                  active={
                    importer.status === "reading" ||
                    importer.status === "ready"
                  }
                  done={importer.status === "ready"}
                  title="Leitura do JSON"
                />

                <StatusCard
                  active={importer.status === "ready"}
                  done={importer.status === "ready"}
                  title="Revisão preparada"
                />

                <StatusCard
                  active={importer.transactions.length > 0}
                  done={importer.transactions.length > 0}
                  title="Aguardando confirmação"
                />
              </div>
            </div>

            <ImportSummary
              file={importer.file}
              source={importer.source}
              status={importer.status}
              transactionsCount={importer.transactions.length}
              totalAmount={importer.totalAmount}
              onConfirm={importer.confirmImport}
              disabled={importer.transactions.length === 0}
            />
          </aside>
        </section>
      </section>

      <ImportManualModal
        open={importer.manualModalOpen}
        editingIndex={importer.editingIndex}
        manualForm={importer.manualForm}
        manualLines={importer.manualLines}
        onClose={importer.closeManualModal}
        onSetManualForm={importer.setManualForm}
        onUpdateManualLine={importer.updateManualLine}
        onAddManualLine={importer.addManualLine}
        onRemoveManualLine={importer.removeManualLine}
        onSave={importer.saveManualTransaction}
      />

      <ImportResultModal
        result={importer.importResult}
        onClose={importer.clearImportResult}
      />
    </main>
  );
}
