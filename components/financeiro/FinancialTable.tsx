interface FinancialEntry {
  id: number;
  descricao: string;
  valor: number;
}

interface FinancialTableProps {
  entries: FinancialEntry[];
}

export function FinancialTable({
  entries,
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
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}