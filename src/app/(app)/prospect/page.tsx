import { ProspectView } from "@/components/prospect/prospect-view";

export const dynamic = "force-dynamic";

export default function ProspectPage() {
  const hasToken = !!process.env.APIFY_TOKEN;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Prospecção no Google</h2>
        <p className="text-sm text-muted">
          Busque empresas por nicho e cidade, filtre as que não têm site e
          importe direto para o funil
        </p>
      </div>

      {!hasToken && (
        <div className="card border-warning/40 bg-warning/5 p-4 text-sm text-warning">
          <b>APIFY_TOKEN não configurado.</b> Adicione a variável de ambiente
          com seu token do Apify para ativar a busca real.
        </div>
      )}

      <ProspectView />
    </div>
  );
}
