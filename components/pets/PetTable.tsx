import Link from "next/link";
interface Pet {
  id: number;
  nome: string;
  especie: string;
  raca: string;
  tutors?: {
    nome: string;
  };
}

interface PetTableProps {
  pets: Pet[];
  onDelete: (id: number) => void;
  onEdit: (pet: Pet) => void;
}

export function PetTable({
  pets,
  onDelete,
  onEdit,
}: PetTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-4">Nome</th>
            <th className="text-left p-4">Espécie</th>
            <th className="text-left p-4">Raça</th>
            <th className="text-left p-4">Tutor</th>
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>

        <tbody>
          {pets.map((pet) => (
            <tr
              key={pet.id}
              className="border-t border-slate-100"
            >
              <td className="p-4">
  <Link
    href={`/pets/${pet.id}`}
    className="text-[#8A0EEA] font-medium hover:underline"
  >
    {pet.nome}
  </Link>
</td>
              <td className="p-4">{pet.especie}</td>
              <td className="p-4">{pet.raca}</td>
              <td className="p-4">
  {pet.tutors?.nome || "-"}
</td>
              <td className="p-4 flex gap-4">

  <button
    className="text-blue-600"
    onClick={() => onEdit(pet)}
  >
    Editar
  </button>

  <button
    className="text-red-600"
    onClick={() => {
      const confirmar =
        window.confirm(
          `Excluir ${pet.nome}?`
        );

      if (confirmar) {
        onDelete(pet.id);
      }
    }}
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