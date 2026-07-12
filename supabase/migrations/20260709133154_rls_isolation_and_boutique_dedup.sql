-- ============================================================================
-- Migración: Aislamiento RLS + fix de boutiques duplicadas
-- Fecha: 2026-07-09
--
-- Contexto: Un race condition en el patrón "SELECT-then-INSERT" (sin UNIQUE en
-- owner_id) permitía crear múltiples boutiques por dueño. Esta migración:
--   1. Consolida datos fragmentados en una boutique canónica por dueño
--   2. Elimina las boutiques duplicadas vacías
--   3. Agrega UNIQUE(owner_id) como defensa definitiva a nivel DB
--   4. Reescribe las políticas RLS para aislar cada boutique por dueño
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTE 1: Consolidar boutiques duplicadas por dueño
-- Mueve products/sales a la boutique más antigua (canónica) de cada owner,
-- luego borra las boutiques duplicadas vacías.
-- ----------------------------------------------------------------------------

-- Boutique canónica = la más antigua (menor created_at) por owner_id
WITH canonical AS (
  SELECT DISTINCT ON (owner_id) owner_id, id AS canonical_id
  FROM public.boutiques
  ORDER BY owner_id, created_at ASC
),
dupes AS (
  SELECT b.id AS dup_id, c.canonical_id
  FROM public.boutiques b
  JOIN canonical c ON c.owner_id = b.owner_id
  WHERE b.id <> c.canonical_id
)
-- Reasignar productos de duplicadas a la canónica
UPDATE public.products p
SET boutique_id = d.canonical_id
FROM dupes d
WHERE p.boutique_id = d.dup_id;

WITH canonical AS (
  SELECT DISTINCT ON (owner_id) owner_id, id AS canonical_id
  FROM public.boutiques
  ORDER BY owner_id, created_at ASC
),
dupes AS (
  SELECT b.id AS dup_id, c.canonical_id
  FROM public.boutiques b
  JOIN canonical c ON c.owner_id = b.owner_id
  WHERE b.id <> c.canonical_id
)
-- Reasignar ventas de duplicadas a la canónica
UPDATE public.sales s
SET boutique_id = d.canonical_id
FROM dupes d
WHERE s.boutique_id = d.dup_id;

-- Borrar las boutiques duplicadas (ya sin datos que referencien)
WITH canonical AS (
  SELECT DISTINCT ON (owner_id) owner_id, id AS canonical_id
  FROM public.boutiques
  ORDER BY owner_id, created_at ASC
)
DELETE FROM public.boutiques b
USING canonical c
WHERE c.owner_id = b.owner_id
  AND b.id <> c.canonical_id;

-- ----------------------------------------------------------------------------
-- PARTE 2: Constraint UNIQUE en owner_id (defensa definitiva)
-- Con esto es IMPOSIBLE crear dos boutiques para el mismo dueño, aunque el
-- código fallara. Habilita el upsert onConflict:'owner_id' del app.
-- ----------------------------------------------------------------------------
ALTER TABLE public.boutiques
  ADD CONSTRAINT boutiques_owner_id_key UNIQUE (owner_id);

-- ----------------------------------------------------------------------------
-- PARTE 3: Reescribir políticas RLS — aislamiento por dueño
-- Cada usuario autenticado solo ve/modifica los datos de SU boutique.
-- El service_role (usado en server actions) salta RLS automáticamente.
-- ----------------------------------------------------------------------------

-- Limpiar políticas viejas rotas/duplicadas
DROP POLICY IF EXISTS "Dueños ven su propia boutique" ON public.boutiques;
DROP POLICY IF EXISTS "Users can view own boutique" ON public.boutiques;
DROP POLICY IF EXISTS "boutique_all_authenticated" ON public.boutiques;
DROP POLICY IF EXISTS "products_all_authenticated" ON public.products;
DROP POLICY IF EXISTS "Dueño puede insertar sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Usuarios solo ven sus propios items de venta" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_all_authenticated" ON public.sale_items;
DROP POLICY IF EXISTS "sales_all_authenticated" ON public.sales;

-- Asegurar RLS activo
ALTER TABLE public.boutiques  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- === BOUTIQUES: dueño ve/edita solo la suya ===
CREATE POLICY "boutique_select_own" ON public.boutiques
  FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "boutique_insert_own" ON public.boutiques
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "boutique_update_own" ON public.boutiques
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "boutique_delete_own" ON public.boutiques
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- === PRODUCTS: solo los de una boutique del dueño ===
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

-- === SALES: solo las de una boutique del dueño ===
CREATE POLICY "sales_select_own" ON public.sales
  FOR SELECT TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "sales_insert_own" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "sales_update_own" ON public.sales
  FOR UPDATE TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "sales_delete_own" ON public.sales
  FOR DELETE TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

-- === SALE_ITEMS: solo los de una venta de la boutique del dueño ===
CREATE POLICY "sale_items_select_own" ON public.sale_items
  FOR SELECT TO authenticated
  USING (sale_id IN (
    SELECT s.id FROM public.sales s
    JOIN public.boutiques b ON b.id = s.boutique_id
    WHERE b.owner_id = (SELECT auth.uid())));

CREATE POLICY "sale_items_insert_own" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (sale_id IN (
    SELECT s.id FROM public.sales s
    JOIN public.boutiques b ON b.id = s.boutique_id
    WHERE b.owner_id = (SELECT auth.uid())));

CREATE POLICY "sale_items_update_own" ON public.sale_items
  FOR UPDATE TO authenticated
  USING (sale_id IN (
    SELECT s.id FROM public.sales s
    JOIN public.boutiques b ON b.id = s.boutique_id
    WHERE b.owner_id = (SELECT auth.uid())))
  WITH CHECK (sale_id IN (
    SELECT s.id FROM public.sales s
    JOIN public.boutiques b ON b.id = s.boutique_id
    WHERE b.owner_id = (SELECT auth.uid())));

CREATE POLICY "sale_items_delete_own" ON public.sale_items
  FOR DELETE TO authenticated
  USING (sale_id IN (
    SELECT s.id FROM public.sales s
    JOIN public.boutiques b ON b.id = s.boutique_id
    WHERE b.owner_id = (SELECT auth.uid())));
