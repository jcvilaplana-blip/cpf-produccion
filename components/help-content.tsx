"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, ArrowRight, Coins, HelpCircle } from "lucide-react"
import Link from "next/link"

interface HelpContentProps {
  userType: string
}

export function HelpContent({ userType }: HelpContentProps) {
  const workerFAQs = [
    {
      question: "¿Cómo creo mi perfil de trabajador?",
      answer:
        "Para crear tu perfil, ve a la sección de Perfil y completa toda tu información: experiencia laboral, formación, especialidades y sube tu video de presentación. Un perfil completo aumenta tus posibilidades de ser contactado por empresas.",
    },
    {
      question: "¿Cómo subo mi video de presentación?",
      answer:
        "En tu perfil, encontrarás la sección 'Video de Presentación'. Haz clic en 'Subir Video' y selecciona un video de hasta 1 minuto en formato vertical (9:16). Asegúrate de presentarte profesionalmente y destacar tus habilidades.",
    },
    {
      question: "¿Cómo busco ofertas de trabajo?",
      answer:
        "Usa el icono de búsqueda en el menú inferior. Puedes filtrar por ubicación, categoría, tipo de jornada, salario y modalidad (presencial/remoto). También puedes ver ofertas flash para oportunidades urgentes.",
    },
    {
      question: "¿Qué son las ofertas flash?",
      answer:
        "Las ofertas flash son trabajos urgentes que las empresas necesitan cubrir rápidamente. Estas ofertas tienen prioridad en los resultados y suelen tener un proceso de selección más ágil.",
    },
    {
      question: "¿Cómo guardo ofertas favoritas?",
      answer:
        "En cada oferta de trabajo, encontrarás un icono de corazón. Haz clic para guardarla en tus favoritos. Puedes ver todas tus ofertas guardadas en el icono de Guardados del menú inferior.",
    },
    {
      question: "¿Cómo me contactan las empresas?",
      answer:
        "Las empresas pueden contactarte a través del sistema de mensajería interno. Recibirás notificaciones cuando tengas nuevos mensajes. También pueden solicitar entrevistas directamente desde tu perfil.",
    },
    {
      question: "¿Qué es el sistema de valoraciones?",
      answer:
        "Después de trabajar con una empresa, ambos pueden valorarse mutuamente. Las valoraciones ayudan a construir tu reputación profesional y aumentan tu visibilidad en la plataforma.",
    },
    {
      question: "¿Necesito una suscripción premium?",
      answer:
        "La versión gratuita te permite crear tu perfil, buscar ofertas y ser contactado por empresas. La suscripción premium ofrece ventajas como mayor visibilidad, destacar tu perfil y acceso prioritario a ofertas flash.",
    },
  ]

  const businessFAQs = [
    {
      question: "¿Cómo publico una oferta de trabajo?",
      answer:
        "Haz clic en el botón '+' naranja en el centro del menú inferior. Completa todos los detalles de la oferta: título, descripción, requisitos, salario, ubicación y tipo de jornada. Puedes marcarla como 'Oferta Flash' para mayor visibilidad.",
    },
    {
      question: "¿Qué son las ofertas flash?",
      answer:
        "Las ofertas flash son publicaciones urgentes que aparecen destacadas en la plataforma. Son ideales cuando necesitas cubrir un puesto rápidamente. Tienen mayor visibilidad y llegan a más candidatos.",
    },
    {
      question: "¿Cómo busco candidatos?",
      answer:
        "Desde tu dashboard, puedes ver candidatos destacados. También puedes usar la búsqueda avanzada para filtrar por categoría, ubicación, experiencia y disponibilidad. Los videos de presentación te ayudan a conocer mejor a cada candidato.",
    },
    {
      question: "¿Cómo funciona el sistema de favoritos?",
      answer:
        "Cuando encuentres un candidato interesante, haz clic en el corazón para guardarlo en favoritos. Puedes organizar tus candidatos favoritos y contactarlos cuando lo necesites desde la sección de Favoritos.",
    },
    {
      question: "¿Cómo contacto a un candidato?",
      answer:
        "En el perfil de cada candidato, encontrarás el botón 'Contactar'. Esto abrirá una conversación en el sistema de mensajería. También puedes solicitar una entrevista directamente desde su perfil.",
    },
    {
      question: "¿Cómo programo entrevistas?",
      answer:
        "En la sección de Mensajes, encontrarás la pestaña 'Entrevistas'. Desde ahí puedes proponer fechas y horarios a los candidatos. El sistema te ayuda a gestionar todas tus entrevistas programadas.",
    },
    {
      question: "¿Qué métricas puedo ver en mi dashboard?",
      answer:
        "Tu dashboard muestra estadísticas importantes: ofertas activas, visualizaciones totales, candidatos en favoritos, entrevistas programadas, mensajes sin leer y aplicaciones recientes. Esto te ayuda a gestionar tu proceso de reclutamiento.",
    },
    {
      question: "¿Cómo funciona el sistema de valoraciones?",
      answer:
        "Después de contratar a un trabajador, puedes valorar su desempeño. Las valoraciones ayudan a otros empleadores y construyen la reputación de los trabajadores en la plataforma. Sé justo y constructivo en tus comentarios.",
    },
    {
      question: "¿Puedo editar o eliminar mis ofertas?",
      answer:
        "Sí, desde la sección 'Mis Ofertas' puedes editar cualquier oferta activa o marcarla como cerrada cuando hayas encontrado al candidato ideal. Las ofertas cerradas se archivan automáticamente.",
    },
  ]

  const faqs = userType === "business" ? businessFAQs : workerFAQs

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Centro de Ayuda</CardTitle>
                <CardDescription>
                  {userType === "business"
                    ? "Preguntas frecuentes para empresas"
                    : "Preguntas frecuentes para trabajadores"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Card-botón a "Cómo ganar puntos". Va antes de las preguntas y no
                al final: quien abre la ayuda suele venir con una duda concreta,
                y si esto quedara bajo el acordeón sólo lo vería quien ya la
                hubiera resuelto. */}
            <Link
              href="/rewards/how-to-earn"
              className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-[#F48221]/40 bg-gradient-to-r from-[#F48221]/10 to-[#F5A623]/10 p-4 transition-colors hover:border-[#F48221]/70 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F48221]/15">
                <Coins className="h-7 w-7 text-[#F48221]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-[#D9721D]">Cómo ganar puntos</p>
                <p className="text-[13px] leading-snug text-muted-foreground">
                  Todas las formas de acumular puntos y canjearlos por ventajas
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[#F48221]" />
            </Link>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">¿No encuentras lo que buscas?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Si tienes alguna pregunta que no está en esta lista, no dudes en contactarnos.
              </p>
              <Link
                href="/messages?candidateId=6c6bb007-25d5-4430-9df6-a5151f0e10a4"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Contactar Soporte
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
