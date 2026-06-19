"use client";

import { FinishAppointmentModal }
from "@/components/agenda/FinishAppointmentModal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AppointmentTable } from "@/components/agenda/AppointmentTable";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";

export default function AgendaPage() {
const [appointments, setAppointments] =
  useState<any[]>([]);

const [pets, setPets] =
  useState<any[]>([]);

const [tutors, setTutors] =
  useState<any[]>([]);
  const [
  appointmentToFinish,
  setAppointmentToFinish,
] = useState<any>(null);

const [
  finishModalOpen,
  setFinishModalOpen,
] = useState(false);


useEffect(() => {
  async function loadPets() {
    const { data, error } =
      await supabase
        .from("pets")
        .select(`
          *,
          tutors (
            nome
          )
        `);

    if (error) {
      console.error(error);
      return;
    }

    setPets(data || []);
  }

  loadPets();
}, []);

useEffect(() => {
  async function loadTutors() {
    const { data, error } =
      await supabase
        .from("tutors")
        .select("*")
        .order("nome");

    if (error) {
      console.error(error);
      return;
    }

    setTutors(data || []);
  }

  loadTutors();
}, []);

useEffect(() => {
  async function loadAppointments() {
    const { data, error } =
      await supabase
        .from("appointments")
        .select(`
          *,
          pets (
            nome
          )
        `);

    if (error) {
      console.error(error);
      return;
    }

    setAppointments(data || []);
  }

  loadAppointments();
}, []);
  return (
  <div className="flex">
    <Sidebar />

    <main className="flex-1 bg-slate-50 min-h-screen">
      <Header />

      <div className="p-8 space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-[#8A0EEA]">
            Agenda
          </h1>

          <p className="text-slate-500">
            Gerencie os agendamentos
          </p>
        </div>

        <NewAppointmentModal
          tutors={tutors}
          pets={pets}
          onSave={async (novoAgendamento) => {

    const petSelecionado =
      pets.find(
        (p) =>
          p.nome ===
          novoAgendamento.pet
      );

    if (!petSelecionado) {
      alert("Pet não encontrado");
      return;
    }

    const { error } =
      await supabase
        .from("appointments")
        .insert([
          {
            pet_id:
              petSelecionado.id,
            servico:
              novoAgendamento.servico,
            data:
              novoAgendamento.data,
            hora:
              novoAgendamento.hora,
            status:
              novoAgendamento.status,
          },
        ]);

    if (error) {
      console.error(error);
      alert(
        error.message
      );
      return;
    }

    alert(
      "Agendamento criado com sucesso!"
    );
    const { data } =
  await supabase
    .from("appointments")
    .select(`
      *,
      pets (
        nome
      )
    `);

setAppointments(data || []);
  }}
/>

      </div>

   <AppointmentTable
  appointments={appointments}

  onFinish={(appointment) => {
    setAppointmentToFinish(
      appointment
    );
  }}

  onComplete={async (id) => {

    const { error } =
      await supabase
        .from("appointments")
        .update({
          status: "Concluído",
        })
        .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    const { data } =
      await supabase
        .from("appointments")
        .select(`
          *,
          pets (
            nome
          )
        `);

    setAppointments(data || []);
  }}

  onDelete={async (id) => {

    const { error } =
      await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setAppointments(
      appointments.filter(
        (a) => a.id !== id
      )
    );
  }}
/>

          </div>
          {appointmentToFinish && (

  <FinishAppointmentModal
    pet={
      appointmentToFinish
        .pets?.nome || ""
    }

    onSave={async ({
      valor,
      formaPagamento,
    }) => {

      const { error } =
        await supabase
          .from(
            "financial_entries"
          )
          .insert([
            {
              descricao:
                `Consulta - ${
                  appointmentToFinish
                    .pets?.nome
                }`,

              valor,

              tipo:
                "Receita",

              forma_pagamento:
                formaPagamento,
            },
          ]);

      if (error) {
        console.error(error);
        alert(
          error.message
        );
        return;
      }

      await supabase
        .from("appointments")
        .update({
          status:
            "Concluído",
        })
        .eq(
          "id",
          appointmentToFinish.id
        );

      alert(
        "Atendimento finalizado!"
      );

      setAppointmentToFinish(
        null
      );

      const { data } =
        await supabase
          .from(
            "appointments"
          )
          .select(`
            *,
            pets (
              nome
            )
          `);

      setAppointments(
        data || []
      );
    }}
  />

)}
    </main>
  </div>
);
}