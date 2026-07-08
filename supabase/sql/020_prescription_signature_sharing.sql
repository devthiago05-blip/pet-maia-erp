begin;

alter table public.user_profiles
add column if not exists crmv_state text;

alter table public.user_profiles
add column if not exists mapa_registration text;

alter table public.user_profiles
add column if not exists signature_text text;

alter table public.clinical_prescription_documents
add column if not exists professional_crmv_state text;

alter table public.clinical_prescription_documents
add column if not exists professional_mapa_registration text;

alter table public.clinical_prescription_documents
add column if not exists signature_text text;

alter table public.clinical_prescription_documents
add column if not exists share_token uuid not null default gen_random_uuid();

alter table public.clinical_prescription_documents
add column if not exists share_enabled boolean not null default false;

alter table public.clinical_prescription_documents
add column if not exists reissue_count integer not null default 0
check (reissue_count >= 0);

alter table public.clinical_prescription_documents
add column if not exists last_reissued_at timestamptz;

create unique index if not exists prescription_documents_share_token_idx
on public.clinical_prescription_documents (share_token);

update public.clinical_prescription_documents document
set
  professional_crmv_state = coalesce(
    document.professional_crmv_state,
    profile.crmv_state
  ),
  professional_mapa_registration = coalesce(
    document.professional_mapa_registration,
    profile.mapa_registration
  ),
  signature_text = coalesce(
    document.signature_text,
    profile.signature_text,
    document.professional_name
  )
from public.user_profiles profile
where profile.id = document.professional_id;

grant update (crmv_state, mapa_registration, signature_text)
on public.user_profiles to authenticated;

create or replace function public.get_shared_prescription(
  requested_token uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'clinic', (
      select jsonb_build_object(
        'name', settings.nome,
        'phone', settings.telefone,
        'address', settings.endereco,
        'city', settings.pix_city
      )
      from public.clinic_settings settings
      where settings.id = 1
    ),
    'document', jsonb_build_object(
      'id', document.id,
      'issue_date', document.issue_date,
      'general_instructions', document.general_instructions,
      'status', document.status,
      'issued_at', document.issued_at
    ),
    'professional', jsonb_build_object(
      'name', document.professional_name,
      'crmv', document.professional_crmv,
      'crmv_state', document.professional_crmv_state,
      'mapa_registration', document.professional_mapa_registration,
      'signature_text', document.signature_text
    ),
    'pet', jsonb_build_object(
      'id', pet.id,
      'name', pet.nome,
      'species', pet.especie,
      'breed', pet.raca,
      'sex', pet.sexo,
      'age', pet.idade,
      'tutor_name', tutor.nome,
      'tutor_address', tutor.endereco
    ),
    'items', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'medication', item.medication,
            'dosage', item.dosage,
            'frequency', item.frequency,
            'duration', item.duration,
            'instructions', item.instructions,
            'item_type', item.item_type,
            'prescription_type', item.prescription_type,
            'pharmacy_type', item.pharmacy_type,
            'administration_route', item.administration_route,
            'quantity', item.quantity,
            'quantity_unit', item.quantity_unit,
            'pharmaceutical_form', item.pharmaceutical_form,
            'composition', item.composition,
            'components', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'name', component.component_name,
                    'concentration', component.concentration,
                    'unit', component.unit
                  )
                  order by component.sort_order, component.id
                ),
                '[]'::jsonb
              )
              from public.prescription_formula_components component
              where component.clinical_prescription_id = item.id
            )
          )
          order by item.created_at, item.id
        ),
        '[]'::jsonb
      )
      from public.clinical_prescriptions item
      where item.prescription_document_id = document.id
    )
  )
  from public.clinical_prescription_documents document
  join public.pets pet on pet.id = document.pet_id
  left join public.tutors tutor on tutor.id = pet.tutor_id
  where document.share_token = requested_token
    and document.share_enabled = true
    and document.status = 'emitida';
$$;

revoke all on function public.get_shared_prescription(uuid) from public;
grant execute on function public.get_shared_prescription(uuid)
to anon, authenticated;

commit;

select
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name in ('crmv_state', 'mapa_registration', 'signature_text')
  ) as professional_profile_columns,
  (
    select count(*)
    from public.clinical_prescription_documents
    where share_token is not null
  ) as prescription_share_tokens,
  (
    select count(*)
    from public.clinical_prescription_documents
    where share_enabled = true
  ) as shared_prescriptions;
