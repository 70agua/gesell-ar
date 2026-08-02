-- ============================================================
--  Fase 8 · Elegir premium con el pase TODAVÍA SIN ACTIVAR
--
--  Problema: el Cupopack tiene su momento principal justo después de la
--  compra del Pase (§6 de docs/3-cupopacks.md) — el turista acaba de pagar y
--  tiene los slots vacíos. Pero un pase comprado nace 'pendiente', y
--  `elegir_premium_pase` exigía 'activo'. Las dos únicas salidas eran malas:
--  activar ahí mismo (quema días de viaje, que es justo lo que la Fase 6
--  resolvió con la activación programada) o no ofrecer nada.
--
--  Se relaja a 'pendiente' + 'activo'. No abre ningún agujero:
--
--   · Elegir NO es canjear. `canjear_beneficio` sigue pidiendo pase activo,
--     así que un premium elegido con el pase dormido no se puede usar hasta
--     que arranque.
--   · El slot se OCUPA, no se consume (§4.3): `quitar_premium_pase` lo suelta
--     y esa función nunca miró el estado, así que ya funcionaba con pendiente.
--     Sin este cambio la asimetría era al revés de lo razonable: se podía
--     soltar lo que no se había podido elegir.
--   · Es lo mismo que ya hace la Fase 5b, donde se puede PEDIR fecha con el
--     pase sin activar por exactamente esta razón.
--
--  Queda 'vencido' afuera, que es el único estado donde elegir no tendría
--  sentido.
--
--  Efecto lateral asumido: el cupo mensual del socio se cuenta por el mes en
--  que se ELIGE (`to_char(elegida_el,'YYYY-MM')`), no por el del canje. Con
--  pases dormidos es más probable que no coincidan. Se deja así porque el
--  cupo existe para que el socio no se sobrecomprometa, y contar al elegir
--  es el lado conservador: el compromiso ya está tomado.
-- ============================================================

create or replace function public.elegir_premium_pase(p_usuario_pase uuid, p_promocion uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid   uuid := auth.uid();
  v_pase  usuario_pases;
  v_def   pases;
  v_promo promociones;
  v_usadas int;
  v_max    int;
  v_cupo   int;
  v_mes    text := to_char(now(), 'YYYY-MM');
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;

  select * into v_pase from usuario_pases where id = p_usuario_pase for update;
  if not found or v_pase.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'pase_no_encontrado'); end if;
  -- ÚNICO cambio respecto de la versión anterior.
  if v_pase.estado not in ('activo', 'pendiente') then
    return jsonb_build_object('ok', false, 'error', 'pase_no_activo'); end if;

  select * into v_promo from promociones where id = p_promocion;
  if not found or v_promo.activa is not true then
    return jsonb_build_object('ok', false, 'error', 'promo_no_disponible'); end if;
  if coalesce(v_promo.ahorro_estimado, 0) <= 15000 then
    return jsonb_build_object('ok', false, 'error', 'no_es_premium'); end if;

  -- Con fecha a confirmar no se elige: se pide (enviar_solicitud_fecha).
  if coalesce(v_promo.requiere_fecha, false) then
    return jsonb_build_object('ok', false, 'error', 'requiere_solicitud'); end if;

  select * into v_def from pases where id = v_pase.pase_id;
  v_max := coalesce(v_pase.elecciones_premium, v_pase.dias,
                    v_def.elecciones_premium, v_def.duracion_dias, 3);

  -- El tope cuenta elecciones + solicitudes en suspenso: una sola definición.
  if slots_premium_ocupados(p_usuario_pase) >= v_max then
    return jsonb_build_object('ok', false, 'error', 'max_elecciones'); end if;

  -- Cupo mensual del socio para esta oferta. `premium_ilimitado` la saltea.
  if v_promo.premium_ilimitado is not true then
    v_cupo := v_promo.cupo_mensual_premium;
    if v_cupo is null or v_cupo <= 0 then
      return jsonb_build_object('ok', false, 'error', 'sin_cupo'); end if;
    select count(*) into v_usadas from pase_elecciones e
      where e.promocion_id = p_promocion and to_char(e.elegida_el, 'YYYY-MM') = v_mes;
    if v_usadas >= v_cupo then
      return jsonb_build_object('ok', false, 'error', 'cupo_agotado'); end if;
  end if;

  insert into pase_elecciones (usuario_pase_id, promocion_id)
    values (p_usuario_pase, p_promocion);
  return jsonb_build_object('ok', true);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'ya_elegida');
end; $function$;

grant execute on function public.elegir_premium_pase(uuid, uuid) to anon, authenticated;
