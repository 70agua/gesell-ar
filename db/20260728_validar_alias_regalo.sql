-- ============================================================
--  20260728_validar_alias_regalo.sql
--  El huésped llega con un código de 6 dígitos que le dictó el hotel y
--  todavía no tiene cuenta. Necesita saber si el código sirve ANTES de
--  registrarse — si no, se registra para nada y se va.
--
--  Va por RPC y no por un select a socio_alias porque esa tabla tiene RLS
--  ("Socio ve su alias") y abrirla al público sería peor que el problema:
--  son 6 dígitos, cualquiera podría barrer el espacio y quedarse con los
--  pases-regalo de todos los hoteles.
--
--  La función devuelve lo mínimo para pintar la pantalla — el nombre del
--  alojamiento, para que el huésped confirme que es el suyo — y el negocio_id,
--  que después consume activar_regalo_pase. No expone unidades, ni el mail
--  del socio, ni cuántos pases lleva regalados.
--
--  Valida además lo que haría fracasar la activación posterior:
--  alojamiento existente y activo, y cupo mensual disponible si no es de pago.
-- ============================================================

create or replace function public.validar_alias_regalo(p_codigo text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_negocio_id uuid;
  v_nombre     text;
  v_activo     boolean;
  v_plan       text;
  v_mes        text := to_char(now(), 'YYYY-MM');
  v_usados     int;
begin
  -- Normalizamos igual que la UI: sólo dígitos, exactamente 6.
  p_codigo := regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g');
  if length(p_codigo) <> 6 then
    return jsonb_build_object('ok', false, 'error', 'formato');
  end if;

  select a.negocio_id, n.nombre, n.activo, n.plan
    into v_negocio_id, v_nombre, v_activo, v_plan
  from public.socio_alias a
  join public.negocios n on n.id = a.negocio_id
  where a.codigo = p_codigo;

  if v_negocio_id is null then
    return jsonb_build_object('ok', false, 'error', 'inexistente');
  end if;

  if v_activo is not true then
    return jsonb_build_object('ok', false, 'error', 'negocio_inactivo');
  end if;

  -- Mismo tope que aplica activar_regalo_pase: 10/mes si no es plan pago.
  if v_plan <> 'plus' then
    select coalesce(usados, 0) into v_usados
      from public.pase_cupos_regalo
      where negocio_id = v_negocio_id and mes = v_mes;
    if coalesce(v_usados, 0) >= 10 then
      return jsonb_build_object('ok', false, 'error', 'cupo_agotado');
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'negocio_id', v_negocio_id,
    'negocio_nombre', v_nombre
  );
end;
$$;

grant execute on function public.validar_alias_regalo(text) to anon, authenticated;
