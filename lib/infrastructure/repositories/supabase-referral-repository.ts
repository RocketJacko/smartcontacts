import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { Afiliado, ConversionReferido } from '@/lib/domain/entities/referral'

export class SupabaseReferralRepository {
  private getHeaders() {
    const { anonKey } = getSupabaseConfig()
    return {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private getUrl() {
    const { url } = getSupabaseConfig()
    return url
  }

  /**
   * Registra un clic atómico y asocia la atribución de sesión mediante RPC.
   */
  public async registrarClic(
    codigo: string,
    tokenSesion: string,
    ipHash?: string,
    userAgent?: string
  ): Promise<{ success: boolean; urlDestino?: string; error?: string }> {
    try {
      const url = this.getUrl()
      if (!url) return { success: false, error: 'Configuración de Supabase ausente' }

      const res = await fetch(`${url}/rest/v1/rpc/registrar_clic`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          p_codigo: codigo.trim(),
          p_token_sesion: tokenSesion,
          p_ip_hash: ipHash || 'anon',
          p_user_agent: (userAgent || 'browser').substring(0, 200),
        }),
      })

      if (!res.ok) {
        return { success: false, error: await res.text() }
      }

      return await res.json()
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error registrando clic' }
    }
  }

  /**
   * Vincula un prospecto recién agendado con la cookie de atribución activa.
   */
  public async vincularProspectoAgendado(
    tokenSesion: string,
    prospectoId: string,
    email: string,
    telefono: string
  ): Promise<{ success: boolean; afiliadoNombre?: string; esAutoreferido?: boolean }> {
    try {
      const url = this.getUrl()
      if (!url || !tokenSesion) return { success: false }

      const res = await fetch(`${url}/rest/v1/rpc/vincular_prospecto_agendado`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          p_token_sesion: tokenSesion,
          p_prospecto_id: prospectoId,
          p_email: email,
          p_telefono: telefono,
        }),
      })

      if (!res.ok) {
        return { success: false }
      }

      return await res.json()
    } catch {
      return { success: false }
    }
  }

  /**
   * Obtiene la lista de todos los afiliados con sus métricas y enlace.
   */
  public async obtenerAfiliados(): Promise<Afiliado[]> {
    try {
      const url = this.getUrl()
      if (!url) return []

      const [resAfiliados, resEnlaces] = await Promise.all([
        fetch(`${url}/rest/v1/referidos_afiliados?select=*&order=creado_en.desc`, {
          headers: this.getHeaders(),
          cache: 'no-store',
        }),
        fetch(`${url}/rest/v1/referidos_enlaces?select=*`, {
          headers: this.getHeaders(),
          cache: 'no-store',
        }),
      ])

      if (!resAfiliados.ok) return []
      const afiliadosList = await resAfiliados.json()
      const enlacesList = resEnlaces.ok ? await resEnlaces.json() : []

      const enlacesMap: Record<string, any> = {}
      enlacesList.forEach((e: any) => {
        if (!enlacesMap[e.afiliado_id]) enlacesMap[e.afiliado_id] = e
      })

      return afiliadosList.map((a: any) => {
        const e = enlacesMap[a.id]
        return {
          id: a.id,
          nombre: a.nombre,
          email: a.email,
          telefono: a.telefono,
          estado: a.estado,
          saldoPendiente: Number(a.saldo_pendiente) || 0,
          saldoLiquidado: Number(a.saldo_liquidado) || 0,
          totalReferidosAgendados: Number(a.total_referidos_agendados) || 0,
          totalReferidosCerrados: Number(a.total_referidos_cerrados) || 0,
          creadoEn: a.creado_en,
          enlacePrincipal: e
            ? {
                id: e.id,
                afiliadoId: e.afiliado_id,
                codigoReferido: e.codigo_referido,
                slugPersonalizado: e.slug_personalizado,
                urlDestino: e.url_destino,
                clicsTotales: Number(e.clics_totales) || 0,
                activo: e.activo,
                creadoEn: e.creado_en,
              }
            : undefined,
        }
      })
    } catch {
      return []
    }
  }

  /**
   * Crea un nuevo afiliado y le genera atómicamente su código y enlace.
   */
  public async crearAfiliado(
    nombre: string,
    email: string,
    telefono?: string,
    codigoDeseado?: string,
    datosPago?: any
  ): Promise<{ success: boolean; afiliado?: Afiliado; error?: string }> {
    try {
      const url = this.getUrl()
      if (!url) return { success: false, error: 'Configuración ausente' }

      const res = await fetch(`${url}/rest/v1/rpc/crear_afiliado_con_enlace`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          p_nombre: nombre.trim(),
          p_email: email.trim().toLowerCase(),
          p_telefono: telefono?.trim() || null,
          p_codigo_deseado: codigoDeseado?.trim() || null,
          p_banco: datosPago?.banco || 'Bancolombia',
          p_tipo_cuenta: datosPago?.tipoCuenta || 'ahorros',
          p_numero_cuenta: datosPago?.numeroCuenta || null,
          p_titular_cuenta: datosPago?.titularCuenta || nombre,
          p_numero_documento: datosPago?.numeroDocumento || '0',
        }),
      })

      if (!res.ok) {
        return { success: false, error: await res.text() }
      }

      const rpcResult = await res.json()
      if (!rpcResult.success) {
        return { success: false, error: rpcResult.error || 'Error al registrar afiliado' }
      }

      return {
        success: true,
        afiliado: {
          id: rpcResult.afiliado_id,
          nombre: rpcResult.nombre,
          email: rpcResult.email,
          telefono,
          estado: 'activo',
          saldoPendiente: 0,
          saldoLiquidado: 0,
          totalReferidosAgendados: 0,
          totalReferidosCerrados: 0,
          creadoEn: new Date().toISOString(),
          enlacePrincipal: {
            id: rpcResult.enlace_id,
            afiliadoId: rpcResult.afiliado_id,
            codigoReferido: rpcResult.codigo,
            urlDestino: '/#agendar',
            clicsTotales: 0,
            activo: true,
            creadoEn: new Date().toISOString(),
          },
        },
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error creando afiliado' }
    }
  }

  /**
   * Consulta los datos de un afiliado por su código para el portal público.
   */
  public async obtenerAfiliadoPorCodigo(codigo: string): Promise<Afiliado | null> {
    try {
      const url = this.getUrl()
      if (!url) return null

      // Buscar enlace por código
      const resEnlace = await fetch(
        `${url}/rest/v1/referidos_enlaces?or=(codigo_referido.ilike.${encodeURIComponent(codigo.trim())},slug_personalizado.ilike.${encodeURIComponent(codigo.trim())})&limit=1`,
        { headers: this.getHeaders(), cache: 'no-store' }
      )

      if (!resEnlace.ok) return null
      const enlaces = await resEnlace.json()
      if (!enlaces || enlaces.length === 0) return null
      const e = enlaces[0]

      // Buscar afiliado
      const resAfiliado = await fetch(
        `${url}/rest/v1/referidos_afiliados?id=eq.${encodeURIComponent(e.afiliado_id)}&limit=1`,
        { headers: this.getHeaders(), cache: 'no-store' }
      )

      if (!resAfiliado.ok) return null
      const afiliados = await resAfiliado.json()
      if (!afiliados || afiliados.length === 0) return null
      const a = afiliados[0]

      return {
        id: a.id,
        nombre: a.nombre,
        email: a.email,
        telefono: a.telefono,
        estado: a.estado,
        saldoPendiente: Number(a.saldo_pendiente) || 0,
        saldoLiquidado: Number(a.saldo_liquidado) || 0,
        totalReferidosAgendados: Number(a.total_referidos_agendados) || 0,
        totalReferidosCerrados: Number(a.total_referidos_cerrados) || 0,
        creadoEn: a.creado_en,
        enlacePrincipal: {
          id: e.id,
          afiliadoId: e.afiliado_id,
          codigoReferido: e.codigo_referido,
          slugPersonalizado: e.slug_personalizado,
          urlDestino: e.url_destino,
          clicsTotales: Number(e.clics_totales) || 0,
          activo: e.activo,
          creadoEn: e.creado_en,
        },
      }
    } catch {
      return null
    }
  }

  /**
   * Consulta las conversiones registradas en el sistema.
   */
  public async obtenerConversiones(): Promise<ConversionReferido[]> {
    try {
      const url = this.getUrl()
      if (!url) return []

      const [resConv, resAfiliados, resProspectos] = await Promise.all([
        fetch(`${url}/rest/v1/referidos_conversiones?select=*&order=creado_en.desc`, {
          headers: this.getHeaders(),
          cache: 'no-store',
        }),
        fetch(`${url}/rest/v1/referidos_afiliados?select=id,nombre,email`, {
          headers: this.getHeaders(),
          cache: 'no-store',
        }),
        fetch(`${url}/rest/v1/prospectos?select=id,name,email`, {
          headers: this.getHeaders(),
          cache: 'no-store',
        }),
      ])

      if (!resConv.ok) return []
      const convList = await resConv.json()
      const afiliadosList = resAfiliados.ok ? await resAfiliados.json() : []
      const prospectosList = resProspectos.ok ? await resProspectos.json() : []

      const aMap: Record<string, any> = {}
      afiliadosList.forEach((a: any) => { aMap[a.id] = a })

      const pMap: Record<string, any> = {}
      prospectosList.forEach((p: any) => { pMap[p.id] = p })

      return convList.map((c: any) => {
        const a = aMap[c.afiliado_id]
        const p = pMap[c.prospecto_id]
        return {
          id: c.id,
          afiliadoId: c.afiliado_id,
          afiliadoNombre: a?.nombre || 'Afiliado Aliado',
          prospectoId: c.prospecto_id,
          prospectoNombre: p?.name || 'Cliente Agendado',
          prospectoEmail: p?.email,
          tipoAtribucion: c.tipo_atribucion,
          tipoComision: c.tipo_comision,
          montoTransaccion: Number(c.monto_transaccion) || 0,
          porcentajeAplicado: Number(c.porcentaje_aplicado) || 0,
          valorComisionCalculado: Number(c.valor_comision_calculado) || 0,
          estadoLiquidacion: c.estado_liquidacion,
          motivoAtribucionManual: c.motivo_atribucion_manual,
          autorAdmin: c.autor_admin,
          fechaAdquisicion: c.fecha_adquisicion,
          creadoEn: c.creado_en,
        }
      })
    } catch {
      return []
    }
  }

  /**
   * Atribución manual B2B realizada por un administrador desde el CRM.
   */
  public async atribucionManual(
    afiliadoId: string,
    prospectoId: string,
    monto: number,
    motivo: string,
    tipoComision: string,
    porcentaje: number,
    valorComision: number,
    autor: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.getUrl()
      if (!url) return { success: false, error: 'Configuración ausente' }

      const res = await fetch(`${url}/rest/v1/rpc/atribucion_manual_admin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          p_afiliado_id: afiliadoId,
          p_prospecto_id: prospectoId || null,
          p_monto: monto,
          p_motivo: motivo,
          p_tipo_comision: tipoComision,
          p_porcentaje: porcentaje,
          p_valor_comision: valorComision,
          p_autor: autor,
        }),
      })

      if (!res.ok) {
        return { success: false, error: await res.text() }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error en atribución manual' }
    }
  }

  /**
   * Registra una liquidación de comisiones acumuladas.
   */
  public async liquidarAfiliado(
    afiliadoId: string,
    monto: number,
    referencia: string,
    comprobanteUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.getUrl()
      if (!url) return { success: false, error: 'Configuración ausente' }

      // 1. Insertar en referidos_liquidaciones
      const resLiq = await fetch(`${url}/rest/v1/referidos_liquidaciones`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          afiliado_id: afiliadoId,
          monto_total: monto,
          estado: 'pagada',
          referencia_bancaria: referencia,
          comprobante_url: comprobanteUrl || null,
        }),
      })

      if (!resLiq.ok) return { success: false, error: await resLiq.text() }

      // 2. Descontar saldo pendiente y acumular saldo liquidado
      await fetch(`${url}/rest/v1/referidos_afiliados?id=eq.${encodeURIComponent(afiliadoId)}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          saldo_pendiente: 0,
          saldo_liquidado: monto,
        }),
      })

      // 3. Actualizar conversiones a liquidadas
      await fetch(
        `${url}/rest/v1/referidos_conversiones?afiliado_id=eq.${encodeURIComponent(afiliadoId)}&estado_liquidacion=eq.aprobada`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            estado_liquidacion: 'liquidada',
          }),
        }
      )

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error en liquidación' }
    }
  }
}
