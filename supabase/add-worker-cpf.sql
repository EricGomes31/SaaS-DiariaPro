-- Migration: campo CPF no trabalhador (identificador único, independente da chave PIX)
-- Rode este arquivo no SQL Editor do Supabase. Seguro para banco já existente:
-- não apaga nada (usa "if not exists").

alter table public.workers add column if not exists cpf text;
