"use client"

import { useEffect, useState } from "react"

export type HomeMode = "candidato" | "empresa"

const CLAVE = "cpf:modo-inicio"

/**
 * Modo en que el usuario quiere usar CPF: buscando empleo o buscando personal.
 *
 * Decide qué contenido muestra la portada. Se pregunta una sola vez, con una
 * ventana modal, y se recuerda en el navegador — también para quien no tiene
 * cuenta, que es justo quien más necesita orientarse.
 *
 * Para un usuario con sesión el modo no se pregunta: su rol ya lo dice, y
 * preguntárselo sería redundante y confuso.
 *
 * `null` significa "aún no sabemos": puede ser que no se haya elegido nunca o
 * que todavía no se haya leído el almacenamiento. `cargado` distingue ambos
 * casos, para no enseñar la modal en el primer fotograma antes de saber si ya
 * había una elección guardada.
 */
export function useHomeMode(rolDeSesion?: "worker" | "business" | "admin" | null) {
  const [modo, setModo] = useState<HomeMode | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    // El rol de la sesión manda sobre cualquier elección previa.
    if (rolDeSesion === "worker") { setModo("candidato"); setCargado(true); return }
    if (rolDeSesion === "business" || rolDeSesion === "admin") { setModo("empresa"); setCargado(true); return }

    try {
      const guardado = window.localStorage.getItem(CLAVE)
      if (guardado === "candidato" || guardado === "empresa") setModo(guardado)
    } catch {
      // Navegación privada o almacenamiento bloqueado: se preguntará cada vez,
      // que es preferible a romper la portada.
    }
    setCargado(true)
  }, [rolDeSesion])

  const elegir = (nuevo: HomeMode) => {
    setModo(nuevo)
    try {
      window.localStorage.setItem(CLAVE, nuevo)
    } catch {
      // Sin persistencia se vuelve a preguntar; no es motivo para fallar.
    }
  }

  return {
    modo,
    cargado,
    elegir,
    /** Sólo se pregunta a quien no tiene sesión y no ha elegido todavía. */
    debePreguntar: cargado && !rolDeSesion && modo === null,
  }
}
