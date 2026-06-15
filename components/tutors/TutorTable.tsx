interface Tutor {
id: number;
nome: string;
telefone: string;
pets: number;
}

interface TutorTableProps {
  tutors: Tutor[];
  onDelete: (id: number) => void;
  onEdit: (tutor: Tutor) => void;
}

export function TutorTable({
  tutors,
  onDelete,
  onEdit,
}: TutorTableProps) {

return (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full">
  <thead className="bg-slate-50">
    <tr>
      <th className="text-left p-4">Nome</th>
      <th className="text-left p-4">Telefone</th>
      <th className="text-left p-4">Pets</th>
      <th className="text-left p-4">Ações</th>
    </tr>
  </thead>

  <tbody>
      {tutors.map((tutor) => (
        <tr
          key={tutor.id}
          className="border-t border-slate-100"
        >
          <td className="p-4">{tutor.nome}</td>
          <td className="p-4">{tutor.telefone}</td>
          <td className="p-4">{tutor.pets}</td>

          <td className="p-4">
            <button
  onClick={() => onEdit(tutor)}
  className="text-blue-600 mr-4"
>
  Editar
</button>

            <button
  onClick={() => {
  const confirmar = window.confirm(
    `Deseja excluir ${tutor.nome}?`
  );

  if (confirmar) {
    onDelete(tutor.id);
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
