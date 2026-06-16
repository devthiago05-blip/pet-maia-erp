interface FinancialEntry {
  id: number;
  descricao: string;
  valor: number;
}

interface FinancialTableProps {
  entries: FinancialEntry[];
  onDelete: (id: number) => void;
}

export function FinancialTable({
  entries,
  onDelete,
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
              Valor
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
                R$ {entry.valor}
              </td>
              <td className="p-4">

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