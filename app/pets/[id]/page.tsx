export default function PetPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-[#8A0EEA]">
          Ficha do Pet
        </h1>

        <p className="text-slate-500">
          Informações do paciente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4"></div>

          <h2 className="text-xl font-bold text-center">
            Rex
          </h2>

          <p className="text-center text-slate-500">
            Pitbull
          </p>

          <div className="mt-6 space-y-3">

            <div>
              <span className="font-semibold">
                Tutor:
              </span>{" "}
              Thiago Lima
            </div>

            <div>
              <span className="font-semibold">
                Espécie:
              </span>{" "}
              Cachorro
            </div>

            <div>
              <span className="font-semibold">
                Sexo:
              </span>{" "}
              Macho
            </div>

            <div>
              <span className="font-semibold">
                Peso:
              </span>{" "}
              25 kg
            </div>

            <div>
              <span className="font-semibold">
                Nascimento:
              </span>{" "}
              10/03/2022
            </div>

          </div>

        </div>

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h3 className="font-bold text-lg mb-4">
              Observações
            </h3>

            <p className="text-slate-600">
              Nenhuma observação cadastrada.
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h3 className="font-bold text-lg mb-4">
              Histórico
            </h3>

            <div className="space-y-3">

              <div className="border rounded-xl p-3">
                Consulta Clínica
                <br />
                <span className="text-sm text-slate-500">
                  15/06/2026
                </span>
              </div>

              <div className="border rounded-xl p-3">
                Banho e Tosa
                <br />
                <span className="text-sm text-slate-500">
                  20/06/2026
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}