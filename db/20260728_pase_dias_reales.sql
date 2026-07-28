-- ============================================================
--  Pase a medida: los días comprados mandan sobre el catálogo
--
--  Regla vigente: UNA elección premium por día de pase (ver eleccionesPremium
--  en src/lib/pases.js). Es lo que evita el arbitraje — con un número fijo,
--  dos pases de 3 días salían más baratos que uno de 7 por la misma cantidad
--  de premium.
--
--  El pase "a medida" (8 a 30 días) se registra contra la fila de `pases` del
--  pase de 7 días, así que sin estas columnas heredaba 7 días y 7 elecciones
--  aunque hubieras comprado 20.
--
--  NULL = usar los valores del catálogo (pases regalo y compras anteriores).
-- ============================================================
alter table public.pase_compras
  add column if not exists dias int;

alter table public.usuario_pases
  add column if not exists dias int,
  add column if not exists elecciones_premium int;

-- ─── elegir_premium_pase ─────────────────────────────────────
-- Dos cambios sobre la versión de 20260717:
--   1. El tope sale de la instancia del usuario si la tiene, del catálogo si no.
--   2. Se cae la exclusión de alojamiento: ahora el alojamiento con ahorro
--      > $15.000 ES premium y consume una elección, así que no necesita un
--      cupo aparte. Lo único que conserva es su reloj (se puede usar con el
--      pase sin activar; ver esOfertaEstadia).
create or replace function public.elegir_premium_pase(
  p_usuario_pase uuid,
  p_promocion    uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_pase         public.usuario_pases;
  v_def          public.pases;
  v_promo        public.promociones;
  v_usadas       int;
  v_max          int;
  v_cupo         int;
  v_mes          text := to_char(now(), 'YYYY-MM');
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_auth');
  end if;

  select * into v_pase from public.usuario_pases where id = p_usuario_pase;
  if not found or v_pase.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'pase_no_encontrado');
  end if;
  if v_pase.estado <> 'activo' then
    return jsonb_build_object('ok', false, 'error', 'pase_no_activo');
  end if;
  if v_pase.tipo = 'regalo' and v_pase.upgrade_aplicado is not true then
    return jsonb_build_object('ok', false, 'error', 'sin_premium');
  end if;

  select * into v_def from public.pases where id = v_pase.pase_id;

  v_max := coalesce(v_pase.elecciones_premium, v_pase.dias,
                    v_def.elecciones_premium, v_def.duracion_dias, 3);

  select count(*) into v_usadas
    from public.pase_elecciones where usuario_pase_id = p_usuario_pase;
  if v_usadas >= v_max then
    return jsonb_build_object('ok', false, 'error', 'max_elecciones');
  end if;

  select * into v_promo from public.promociones where id = p_promocion;
  if not found or v_promo.activa is not true then
    return jsonb_build_object('ok', false, 'error', 'promo_no_disponible');
  end if;
  -- premium = ahorro declarado > 15.000 (alojamiento incluido)
  if coalesce(v_promo.ahorro_estimado, 0) <= 15000 then
    return jsonb_build_object('ok', false, 'error', 'no_es_premium');
  end if;

  -- cupo mensual del socio para esta oferta
  v_cupo := v_promo.cupo_mensual_premium;
  if v_cupo is null or v_cupo <= 0 then
    return jsonb_build_object('ok', false, 'error', 'sin_cupo');
  end if;
  select count(*) into v_usadas from public.pase_elecciones e
    where e.promocion_id = p_promocion
      and to_char(e.elegida_el, 'YYYY-MM') = v_mes;
  if v_usadas >= v_cupo then
    return jsonb_build_object('ok', false, 'error', 'cupo_agotado');
  end if;

  insert into public.pase_elecciones (usuario_pase_id, promocion_id)
    values (p_usuario_pase, p_promocion);
  return jsonb_build_object('ok', true);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'ya_elegida');
end;
$$;

grant execute on function public.elegir_premium_pase(uuid, uuid) to anon, authenticated;

-- Catálogo alineado a la regla: una elección por día.
update public.pases set elecciones_premium = duracion_dias where activo = true;
