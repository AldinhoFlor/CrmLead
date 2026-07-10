import { CsvImportView } from "@/components/import/csv-import-view";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Importar leads (CSV)</h2>
        <p className="text-sm text-muted">
          Suba sua própria pesquisa por arquivo ou colando o conteúdo. O sistema
          detecta duplicados automaticamente antes de importar.
        </p>
      </div>
      <CsvImportView />
    </div>
  );
}
