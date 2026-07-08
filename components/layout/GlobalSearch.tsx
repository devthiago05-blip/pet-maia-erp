"use client";

import { LoaderCircle, PawPrint, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  type GlobalPetResult,
  type GlobalTutorResult,
  searchClinicalRecords,
} from "@/services/global-search";

export function GlobalSearch({
  includePets,
  includeTutors,
}: {
  includePets: boolean;
  includeTutors: boolean;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [pets, setPets] = useState<GlobalPetResult[]>([]);
  const [tutors, setTutors] = useState<GlobalTutorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (search.trim().length < 2) {
        setPets([]);
        setTutors([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      const response = await searchClinicalRecords({
        search,
        includePets,
        includeTutors,
      });
      setLoading(false);

      if (response.error) {
        console.error(response.error);
        setError("Não foi possível concluir a busca.");
        return;
      }

      setPets(response.pets);
      setTutors(response.tutors);
      setError("");
      setOpen(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [includePets, includeTutors, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const hasResults = pets.length > 0 || tutors.length > 0;
  const showPanel = open && search.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-[#8A0EEA] focus-within:bg-white">
        {loading ? (
          <LoaderCircle size={18} className="animate-spin text-[#8A0EEA]" />
        ) : (
          <Search size={18} className="text-slate-400" />
        )}
        <input
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Buscar tutor, pet ou ID"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPets([]);
              setTutors([]);
              setOpen(false);
            }}
            aria-label="Limpar busca"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        )}
      </label>

      {showPanel && (
        <div className="absolute top-12 right-0 left-0 z-50 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-xl border bg-white shadow-xl">
          {error ? (
            <p className="p-4 text-sm text-red-600">{error}</p>
          ) : !loading && !hasResults ? (
            <p className="p-5 text-center text-sm text-slate-500">
              Nenhum tutor ou pet encontrado.
            </p>
          ) : (
            <>
              {pets.length > 0 && (
                <SearchSection title="Pets">
                  {pets.map((pet) => (
                    <SearchResultLink
                      key={`pet-${pet.id}`}
                      href={`/pets/${pet.id}`}
                      icon={<PawPrint size={17} />}
                      title={`${pet.nome} · ID ${pet.id}`}
                      detail={`${pet.especie || "Espécie não informada"}${pet.raca ? ` · ${pet.raca}` : ""} · Tutor: ${pet.tutors?.nome || "não informado"}`}
                    />
                  ))}
                </SearchSection>
              )}

              {tutors.length > 0 && (
                <SearchSection title="Tutores">
                  {tutors.map((tutor) => (
                    <SearchResultLink
                      key={`tutor-${tutor.id}`}
                      href={`/tutors?search=${encodeURIComponent(tutor.nome)}`}
                      icon={<UserRound size={17} />}
                      title={tutor.nome}
                      detail={`${tutor.pets?.length || 0} pet(s) vinculado(s)${tutor.telefone ? ` · ${tutor.telefone}` : ""}`}
                    />
                  ))}
                </SearchSection>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b last:border-b-0">
      <h3 className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function SearchResultLink({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 border-t px-4 py-3 transition first:border-t-0 hover:bg-purple-50"
    >
      <span className="mt-0.5 text-[#8A0EEA]">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {detail}
        </span>
      </span>
    </Link>
  );
}
