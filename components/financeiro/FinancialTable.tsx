interface FinancialEntry {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;

  forma_pagamento?: string;
  status_pagamento?: string;
}
  

interface FinancialTableProps {
  entries: FinancialEntry[];

  onDelete: (id: number) => void;

  onReceive: (id: number) => void;
}

export function FinancialTable({
  entries,
  onDelete,
  onReceive,
}: FinancialTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      <table className="w-full">

        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-4">
  Descrição
</th>

<th className="text-left p-4">
  Tipo
</th>

<th className="text-left p-4">
  Valor
</th>
<th className="text-left p-4">
  Status
</th>
            <th className="text-left p-4">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-t"
            >
             <td className="p-4">
  {entry.descricao}
</td>

<td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-sm font-medium ${
      entry.tipo === "Despesa"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
    }`}
  >
    {entry.tipo || "Receita"}
  </span>
</td>

<td className="p-4">
  R$ {entry.valor}
</td>

<td className="p-4">
  {entry.status_pagamento === "Pago" ? (
    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
      Pago
    </span>
  ) : (
    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
      Pendente
    </span>
  )}
</td>

<td className="p-4">

  {entry.status_pagamento !==
    "Pago" && (

    <button
      onClick={() =>
        onReceive(entry.id)
      }
      className="text-green-600 mr-3"
    >
      Dar Baixa
    </button>

  )}

  <button
    onClick={() => {
      const confirmar =
        window.confirm(
          "Excluir lançamento?"
        );

      if (confirmar) {
        onDelete(entry.id);
      }
    }}
    className="text-red-600"
  >
    Excluir
  </button>

</td>
</tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}