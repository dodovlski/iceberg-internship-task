begin;

insert into public.demo_rules (id, payload) values
  (
    'material_information',
    '{
      "name": "Material information checks",
      "fields": ["EPC", "Council Tax", "Parking", "Service Charge", "Ground Rent", "Availability", "Tenure", "Lease Length"],
      "mode": "read_only_seed"
    }'::jsonb
  )
on conflict (id) do update set payload = excluded.payload;

commit;
