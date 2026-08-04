-- ============================================================
--  Versionar el fix del umbral base/premium ($15.000 → $40.000)
--
--  El 2026-08-03 se subió el umbral de $15.000 a $40.000 "vía MCP"
--  (ver comentario en 20260803_umbral_premium_40000.sql) pero sin dejar
--  sentencias ejecutables en el repo. Esta migración no cambia nada en
--  la base viva — hoy los 5 lugares YA están en $40.000, confirmado
--  contra la base en vivo antes de escribir esto (pg_get_functiondef /
--  pg_get_constraintdef, 2026-08-04). Lo que hace es dejar esos 5
--  lugares en el historial versionado, con el valor que ya está
--  corriendo, para que "supabase db reset" (entorno nuevo, staging,
--  disaster recovery) reproduzca el estado real y no resucite el
--  $15.000 viejo que todavía tienen 20260717_pase_cuponera.sql,
--  20260728_pase_dias_reales.sql y 20260802_fase8_elegir_con_pase_pendiente.sql.
--
--  De paso quedan versionadas por primera vez `beneficios_en_negocio` y
--  `canjear_beneficio`: en 20260801_fase5_canje.sql sólo hay un comentario
--  con el `pg_get_functiondef(...)` para consultarlas, nunca el cuerpo — el
--  mismo patrón de "aplicado vía MCP, no versionado" que causó este bug,
--  fuera del alcance de este fix puntual pero señalado para no repetirlo.
--
--  Verificado antes de aplicar: 0 filas de `promociones` violarían el
--  CHECK con el valor $40.000 (mismo chequeo que ya se hizo el 2026-08-03).
--
--  NO se tocó `precio_cupon()` / `calcularPrecioCupon()` (cobros.js): esos
--  15000/40000 son los bordes de la escalera de COMISIÓN MARGINAL, un
--  concepto distinto que comparte número por coincidencia, no por relación.
-- ============================================================

-- ─── 1) beneficios_en_negocio — label 'premium'/'incluida' + filtro ───
create or replace function public.beneficios_en_negocio(p_negocio_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_pase usuario_pases; v_items jsonb := '[]'::jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  if not exists (select 1 from negocios where id = p_negocio_id and activo) then
    return jsonb_build_object('ok', false, 'error', 'negocio_no_encontrado');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'tipo', 'cupon', 'ref', c.id, 'titulo', coalesce(c.titulo, p.titulo),
           'ahorro', c.ahorro, 'codigo', c.codigo, 'vence_el', c.vence_el,
           'imagen', p.imagen_url)), '[]'::jsonb)
    into v_items
    from cupones_usuario c join promociones p on p.id = c.promocion_id
   where c.usuario_id = v_uid and c.negocio_id = p_negocio_id
     and c.estado = 'activo'
     and (c.vence_el is null or c.vence_el > now());

  select * into v_pase from usuario_pases
   where user_id = v_uid and estado = 'activo'
     and (vence_el is null or vence_el > now())
   order by fecha_activacion desc limit 1;

  if found then
    if not exists (select 1 from canjes
                    where usuario_pase_id = v_pase.id and negocio_id = p_negocio_id
                      and origen = 'pase' and estado = 'confirmado') then
      select v_items || coalesce(jsonb_agg(jsonb_build_object(
               'tipo', 'pase', 'ref', p.id, 'titulo', p.titulo,
               'ahorro', p.ahorro_estimado, 'imagen', p.imagen_url,
               'capa', case when coalesce(p.ahorro_estimado,0) > 40000 then 'premium' else 'incluida' end)), '[]'::jsonb)
        into v_items
        from promociones p
       where p.negocio_id = p_negocio_id and p.activa and p.aprobada
         and coalesce(p.tokens_costo, 1) <> 0
         and (
           coalesce(p.ahorro_estimado,0) <= 40000
           or exists (select 1 from pase_elecciones e
                       where e.usuario_pase_id = v_pase.id and e.promocion_id = p.id)
         );
    end if;
  end if;

  return jsonb_build_object('ok', true,
    'negocio', (select jsonb_build_object('id', id, 'nombre', nombre, 'localidad', localidad)
                  from negocios where id = p_negocio_id),
    'items', v_items);
end; $function$;

grant execute on function public.beneficios_en_negocio(uuid) to anon, authenticated;

-- ─── 2) canjear_beneficio — exige elección previa si es premium ───
create or replace function public.canjear_beneficio(p_tipo text, p_ref uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_cupon cupones_usuario; v_promo promociones; v_pase usuario_pases;
  v_origen text; v_ahorro numeric := 0; v_neg uuid; v_comp text; v_id uuid;
  v_es_aloj boolean; v_puntos integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;

  if p_tipo = 'cupon' then
    select * into v_cupon from cupones_usuario where id = p_ref and usuario_id = v_uid;
    if not found then return jsonb_build_object('ok', false, 'error', 'cupon_no_encontrado'); end if;
    if v_cupon.estado <> 'activo' then return jsonb_build_object('ok', false, 'error', 'cupon_no_activo'); end if;
    if v_cupon.vence_el is not null and v_cupon.vence_el < now() then
      update cupones_usuario set estado = 'vencido' where id = v_cupon.id;
      return jsonb_build_object('ok', false, 'error', 'cupon_vencido');
    end if;
    v_origen := 'cupon'; v_neg := v_cupon.negocio_id; v_ahorro := v_cupon.ahorro;
    v_comp := v_cupon.codigo;
    select * into v_promo from promociones where id = v_cupon.promocion_id;

  elsif p_tipo = 'pase' then
    select * into v_promo from promociones where id = p_ref and activa and aprobada;
    if not found then return jsonb_build_object('ok', false, 'error', 'promo_no_disponible'); end if;

    select * into v_pase from usuario_pases
     where user_id = v_uid and estado = 'activo' and (vence_el is null or vence_el > now())
     order by fecha_activacion desc limit 1;
    if not found then return jsonb_build_object('ok', false, 'error', 'sin_pase_activo'); end if;

    if coalesce(v_promo.ahorro_estimado,0) > 40000
       and not exists (select 1 from pase_elecciones e
                        where e.usuario_pase_id = v_pase.id and e.promocion_id = v_promo.id) then
      return jsonb_build_object('ok', false, 'error', 'premium_no_elegida');
    end if;

    select n.tipo in ('alojamiento','Hotel','Cabaña','Departamento','Casa','Hostel','Dormi','Domo','Carpa','Glamping')
      into v_es_aloj from negocios n where n.id = v_promo.negocio_id;
    v_origen := case when v_es_aloj then 'estadia' else 'pase' end;

    if v_origen = 'estadia' then
      if v_pase.incluye_estadia is false then
        return jsonb_build_object('ok', false, 'error', 'estadia_no_incluida'); end if;
      if exists (select 1 from canjes where usuario_pase_id = v_pase.id
                   and origen = 'estadia' and estado = 'confirmado') then
        return jsonb_build_object('ok', false, 'error', 'estadia_ya_usada'); end if;
    end if;

    v_neg := v_promo.negocio_id; v_ahorro := coalesce(v_promo.ahorro_estimado, 0);
    v_comp := generar_comprobante_canje();
    if v_pase.tipo = 'comprado' or coalesce(v_pase.upgrade_aplicado, false) then
      v_puntos := 100;
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'tipo_invalido');
  end if;

  begin
    insert into canjes (usuario_id, negocio_id, promocion_id, origen,
                        cupon_id, usuario_pase_id, ahorro_monto, comprobante)
    values (v_uid, v_neg, v_promo.id, v_origen,
            case when v_origen = 'cupon' then v_cupon.id end,
            case when v_origen <> 'cupon' then v_pase.id end,
            v_ahorro, v_comp)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error',
      case when v_origen = 'cupon' then 'cupon_ya_canjeado' else 'ya_canjeado_en_este_comercio' end);
  end;

  if v_origen = 'cupon' then
    update cupones_usuario set estado = 'canjeado', canjeado_en = now() where id = v_cupon.id;
  end if;

  if v_puntos > 0 then
    insert into usuario_tokens (user_id, balance) values (v_uid, 0) on conflict (user_id) do nothing;
    update usuario_tokens set balance = balance + v_puntos where user_id = v_uid;
    insert into token_movimientos (user_id, cantidad, tipo, descripcion, referencia_id)
      values (v_uid, v_puntos, 'pase_canje', 'Canje con el Pase', v_id::text);
  end if;

  return jsonb_build_object('ok', true, 'canje_id', v_id, 'comprobante', v_comp,
    'ahorro', v_ahorro, 'titulo', v_promo.titulo, 'puntos', v_puntos,
    'negocio', (select nombre from negocios where id = v_neg));
end; $function$;

grant execute on function public.canjear_beneficio(text, uuid) to anon, authenticated;

-- ─── 3) elegir_premium_pase — rechaza con 'no_es_premium' bajo el piso ───
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
  if v_pase.estado not in ('activo', 'pendiente') then
    return jsonb_build_object('ok', false, 'error', 'pase_no_activo'); end if;

  select * into v_promo from promociones where id = p_promocion;
  if not found or v_promo.activa is not true then
    return jsonb_build_object('ok', false, 'error', 'promo_no_disponible'); end if;
  if coalesce(v_promo.ahorro_estimado, 0) <= 40000 then
    return jsonb_build_object('ok', false, 'error', 'no_es_premium'); end if;

  if coalesce(v_promo.requiere_fecha, false) then
    return jsonb_build_object('ok', false, 'error', 'requiere_solicitud'); end if;

  -- Pase sin tope: se salta el chequeo de máximo directamente.
  if not coalesce(v_pase.premium_ilimitado, false) then
    select * into v_def from pases where id = v_pase.pase_id;
    v_max := coalesce(v_pase.elecciones_premium, v_pase.dias,
                      v_def.elecciones_premium, v_def.duracion_dias, 3);

    if slots_premium_ocupados(p_usuario_pase) >= v_max then
      return jsonb_build_object('ok', false, 'error', 'max_elecciones'); end if;
  end if;

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

-- ─── 4) enviar_solicitud_fecha — v_premium define si consume slot ───
-- Dos firmas conviven en la base (la de 4 args es la que precedió al
-- formulario de fase/horario/personas por tipo de rubro); se versionan
-- las dos tal como están hoy, no se elige una.
create or replace function public.enviar_solicitud_fecha(
  p_promocion_id uuid, p_fecha date, p_personas integer, p_origen_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid   uuid := auth.uid();
  v_pase  usuario_pases;
  v_promo promociones;
  v_total integer;
  v_ocup  integer;
  v_exp   timestamptz;
  v_id    uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  if p_personas is null or p_personas < 1 then
    return jsonb_build_object('ok', false, 'error', 'personas_invalidas'); end if;
  if p_fecha is null or p_fecha < current_date then
    return jsonb_build_object('ok', false, 'error', 'fecha_pasada'); end if;

  select * into v_promo from promociones
   where id = p_promocion_id and activa and aprobada;
  if not found then return jsonb_build_object('ok', false, 'error', 'oferta_no_disponible'); end if;
  if not coalesce(v_promo.requiere_fecha, false) then
    return jsonb_build_object('ok', false, 'error', 'no_requiere_fecha'); end if;

  -- Se puede pedir con el pase SIN activar: el turista planifica antes de
  -- viajar y no quema días esperando respuestas.
  select * into v_pase from usuario_pases
   where user_id = v_uid and estado in ('activo','pendiente')
   order by (estado = 'activo') desc, creado_en desc
   limit 1
   for update;                                  -- lock: el tope se valida acá
  if not found then return jsonb_build_object('ok', false, 'error', 'sin_pase'); end if;

  -- Con el pase activado, la fecha tiene que caer dentro de su vigencia.
  if v_pase.estado = 'activo' and v_pase.vence_el is not null
     and p_fecha > v_pase.vence_el::date then
    return jsonb_build_object('ok', false, 'error', 'fecha_fuera_de_vigencia',
                              'vence_el', v_pase.vence_el::date);
  end if;

  v_total := coalesce(v_pase.elecciones_premium, v_pase.dias, 1);
  v_ocup  := slots_premium_ocupados(v_pase.id);
  if v_ocup >= v_total then
    return jsonb_build_object('ok', false, 'error', 'sin_slots', 'total', v_total);
  end if;

  -- Timeout: 72 h, o el vencimiento del pase si llega antes.
  v_exp := now() + interval '72 hours';
  if v_pase.estado = 'activo' and v_pase.vence_el is not null and v_pase.vence_el < v_exp then
    v_exp := v_pase.vence_el;
  end if;

  begin
    insert into solicitudes_fecha
      (usuario_pase_id, usuario_id, promocion_id, socio_id,
       fecha_pedida, personas, expira_at, origen_id)
    values (v_pase.id, v_uid, v_promo.id, v_promo.negocio_id,
            p_fecha, p_personas, v_exp, p_origen_id)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'ya_tenes_una_pendiente');
  end;

  return jsonb_build_object('ok', true, 'solicitud_id', v_id, 'expira_at', v_exp,
                            'slots_restantes', v_total - (v_ocup + 1));
end; $function$;

grant execute on function public.enviar_solicitud_fecha(uuid, date, integer, uuid) to anon, authenticated;

create or replace function public.enviar_solicitud_fecha(
  p_promocion_id uuid, p_fecha date, p_origen_id uuid default null,
  p_hora time default null, p_adultos integer default null,
  p_ninos integer default null, p_bebes integer default null, p_mascotas integer default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid(); v_pase usuario_pases; v_promo promociones;
  v_total integer; v_ocup integer; v_exp timestamptz; v_id uuid;
  v_premium boolean; v_personas integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  if p_fecha is null or p_fecha < current_date then
    return jsonb_build_object('ok', false, 'error', 'fecha_pasada'); end if;

  select * into v_promo from promociones where id = p_promocion_id and activa and aprobada;
  if not found then return jsonb_build_object('ok', false, 'error', 'oferta_no_disponible'); end if;

  if not (coalesce(v_promo.requiere_fecha, false) or coalesce(v_promo.requiere_reserva, false)) then
    return jsonb_build_object('ok', false, 'error', 'no_requiere_fecha'); end if;

  if v_promo.pide_horario and p_hora is null then
    return jsonb_build_object('ok', false, 'error', 'falta_horario'); end if;

  if v_promo.personas_fijas is not null then
    v_personas := v_promo.personas_fijas;
  else
    v_personas := coalesce(p_adultos, 0) + coalesce(p_ninos, 0) + coalesce(p_bebes, 0);
    if v_promo.pide_adultos and coalesce(p_adultos, 0) < 1 then
      return jsonb_build_object('ok', false, 'error', 'personas_invalidas'); end if;
    if v_personas < 1 then v_personas := 1; end if;
  end if;

  select * into v_pase from usuario_pases
   where user_id = v_uid and estado in ('activo','pendiente')
   order by (estado = 'activo') desc, creado_en desc limit 1 for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'sin_pase'); end if;

  if v_pase.estado = 'activo' and v_pase.vence_el is not null
     and p_fecha > v_pase.vence_el::date then
    return jsonb_build_object('ok', false, 'error', 'fecha_fuera_de_vigencia',
                              'vence_el', v_pase.vence_el::date);
  end if;

  v_premium := coalesce(v_promo.ahorro_estimado, 0) > 40000;
  -- Pase sin tope: la solicitud consume el conteo igual (para las tandas de
  -- avisos y la bandeja del socio), pero nunca la rechaza por falta de slots.
  if v_premium and not coalesce(v_pase.premium_ilimitado, false) then
    v_total := coalesce(v_pase.elecciones_premium, v_pase.dias, 1);
    v_ocup  := slots_premium_ocupados(v_pase.id);
    if v_ocup >= v_total then
      return jsonb_build_object('ok', false, 'error', 'sin_slots', 'total', v_total);
    end if;
  end if;

  v_exp := now() + interval '72 hours';
  if v_pase.estado = 'activo' and v_pase.vence_el is not null and v_pase.vence_el < v_exp then
    v_exp := v_pase.vence_el;
  end if;

  begin
    insert into solicitudes_fecha
      (usuario_pase_id, usuario_id, promocion_id, socio_id, fecha_pedida,
       personas, adultos, ninos, bebes, mascotas, hora_pedida, expira_at, origen_id)
    values (v_pase.id, v_uid, v_promo.id, v_promo.negocio_id, p_fecha,
            v_personas, p_adultos, p_ninos, p_bebes, p_mascotas, p_hora, v_exp, p_origen_id)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'ya_tenes_una_pendiente');
  end;

  return jsonb_build_object('ok', true, 'solicitud_id', v_id, 'expira_at', v_exp,
                            'premium', v_premium, 'personas', v_personas);
end; $function$;

grant execute on function public.enviar_solicitud_fecha(uuid, date, uuid, time, integer, integer, integer, integer) to anon, authenticated;

-- ─── 5) promociones_premium_definido — exige cupo/ilimitado si es premium ───
alter table public.promociones drop constraint if exists promociones_premium_definido;
alter table public.promociones add constraint promociones_premium_definido check (
  coalesce(borrador, false)
  or coalesce(ahorro_estimado, 0) <= 40000
  or premium_ilimitado is true
  or coalesce(cupo_mensual_premium, 0) >= 1
);
