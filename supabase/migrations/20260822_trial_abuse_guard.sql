-- Anti-abuso del trial de 7 días: una sola prueba por dispositivo/navegador.
--
-- Modelo: las cuentas nuevas SIEMPRE nacen en plan free. El trial se
-- "canjea" explícitamente vía claim_trial(), que registra el device_id +
-- fingerprint del navegador en trial_redemptions. Si cualquiera de los dos
-- ya fue usado, el claim se rechaza y la cuenta se queda en free (sin
-- bloquearla — el plan gratuito funciona).

CREATE TABLE IF NOT EXISTS public.trial_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  fingerprint text,
  user_id uuid,
  boutique_id uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

-- Un solo trial por device_id y por fingerprint (las dos señales independientes
-- son las que bloquean: borrar localStorage cambia device_id pero no el
-- fingerprint del hardware/navegador).
CREATE UNIQUE INDEX IF NOT EXISTS trial_redemptions_device_uniq
  ON public.trial_redemptions(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS trial_redemptions_fp_uniq
  ON public.trial_redemptions(fingerprint) WHERE fingerprint IS NOT NULL;

ALTER TABLE public.trial_redemptions ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service role y la función SECURITY DEFINER la tocan.

-- Canje atómico: inserta la redención y sube la boutique a trial solo si
-- ninguna de las dos señales fue usada antes. Race-safe por los unique indexes.
CREATE OR REPLACE FUNCTION public.claim_trial(
  p_device_id text,
  p_fingerprint text,
  p_user_id uuid,
  p_boutique_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF p_device_id IS NULL OR trim(p_device_id) = '' THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.trial_redemptions WHERE device_id = p_device_id) THEN
    RETURN false;
  END IF;

  IF p_fingerprint IS NOT NULL AND trim(p_fingerprint) <> '' AND
     EXISTS (SELECT 1 FROM public.trial_redemptions WHERE fingerprint = trim(p_fingerprint)) THEN
    RETURN false;
  END IF;

  -- Solo se canjea sobre una boutique que realmente pertenece al usuario.
  IF NOT EXISTS (
    SELECT 1 FROM public.boutiques WHERE id = p_boutique_id AND owner_id = p_user_id
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.trial_redemptions (device_id, fingerprint, user_id, boutique_id)
  VALUES (p_device_id, NULLIF(trim(p_fingerprint), ''), p_user_id, p_boutique_id);

  -- Solo puede reclamarse sobre la boutique del propio usuario.
  UPDATE public.boutiques
     SET plan_type = 'trial',
         is_trial = true,
         is_active = true,
         subscription_expires_at = now() + interval '7 days'
   WHERE id = p_boutique_id AND owner_id = p_user_id;

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    -- Carrera: otro request canjeó la misma señal primero.
    RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_trial(text, text, uuid, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_trial(text, text, uuid, uuid) TO service_role;

-- El trigger de auth.users YA NO regala trial: toda boutique nueva nace free.
-- El trial solo llega vía claim_trial().
CREATE OR REPLACE FUNCTION public.create_default_boutique()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.boutiques (owner_id, name, subscription_expires_at, is_active, is_trial, plan_type)
  VALUES (NEW.id, 'Mi Boutique', NULL, true, false, 'free');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creando boutique para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Seed legacy: los dispositivos que YA consumieron trial (dueños actuales)
-- no pueden volver a canjear con otra cuenta.
INSERT INTO public.trial_redemptions (device_id, fingerprint, user_id, boutique_id)
SELECT d.device_id, NULL, b.owner_id, d.boutique_id
  FROM public.dispositivos d
  JOIN public.boutiques b ON b.id = d.boutique_id
 WHERE d.role = 'owner' AND d.status = 'approved'
ON CONFLICT DO NOTHING;
