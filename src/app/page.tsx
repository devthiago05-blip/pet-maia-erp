export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#8A0EEA]">
          PET MAIA ERP
        </h1>

        <p className="text-gray-600 mt-2">
          Gestão Inteligente para Clínicas e Pet Shops
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-sm text-gray-500">Tutores</h2>
            <p className="text-3xl font-bold mt-2">125</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-sm text-gray-500">Pets</h2>
            <p className="text-3xl font-bold mt-2">320</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-sm text-gray-500">Agendamentos Hoje</h2>
            <p className="text-3xl font-bold mt-2">18</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-sm text-gray-500">Faturamento</h2>
            <p className="text-3xl font-bold mt-2">R$ 8.420</p>
          </div>
        </div>
      </div>
    </main>
  );
}