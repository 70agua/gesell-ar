/**
 * Interruptores de los efectos de scroll — un solo lugar para prenderlos y
 * apagarlos (2026-08-13).
 *
 * Se apagaron a pedido después de dos síntomas que aparecieron juntos y no
 * se sabe todavía cuál los causa: el scroll se traba en el detalle de socio
 * y de oferta, y el scroll general del sitio se siente demasiado lento. La
 * idea es reactivarlos DE A UNO desde acá para aislar la falla, en vez de
 * borrar el código y perder el trabajo hecho.
 *
 * Los efectos de la navbar (aparecer/desaparecer/achicarse) NO están acá:
 * quedan prendidos a propósito, son los primeros sospechosos y se prueban
 * después.
 */

/**
 * Lenis: smooth-scroll global con inercia (acelera y desacelera la rueda).
 * Apagado = el scroll de la página vuelve a ser 100% nativo del navegador.
 *
 * Alcance cuando está en false:
 *  - No se monta la instancia global (`useLenisSmoothScroll`).
 *  - No se monta la instancia local del panel PRO en `HeroPase`; ese panel
 *    tiene `overflow-y:auto` propio, así que scrollea nativo igual.
 *  - `cuponear:scroll-to` (el botón "Conocé todas las ofertas") pasa a usar
 *    `scrollIntoView({ behavior: 'smooth' })` nativo.
 *  - `cuponear:scroll-lock`/`unlock` quedan sin efecto: sin Lenis alcanza
 *    con el `overflow:hidden` en <html>/<body> que ya pone quien bloquea.
 */
export const SCROLL_SUAVE = false;
