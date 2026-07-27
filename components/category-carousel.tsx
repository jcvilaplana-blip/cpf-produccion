"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Utensils, Stethoscope, Palette, Code, DollarSign, GraduationCap, Briefcase } from "lucide-react" 
import Link from "next/link"

const categories = [
  {
    id: "restaurant",
    name: "Restaurante",
    icon: Utensils,
    color: "from-[#E73A36]/10 to-[#E73A36]/5 border-[#E73A36]/20",
    iconColor: "text-[#E73A36]",
  },
  {
    id: "medical",
    name: "Médico",
    icon: Stethoscope,
    color: "from-red-500/10 to-red-500/5 border-red-500/20",
    iconColor: "text-red-500",
  },
  {
    id: "design",
    name: "Diseño",
    icon: Palette,
    color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    iconColor: "text-purple-500",
  },
  {
    id: "information_technology",
    name: "Tecnología",
    icon: Code,
    color: "from-[#01A89E]/10 to-[#01A89E]/5 border-[#01A89E]/20",
    iconColor: "text-[#01A89E]",
  },
  {
    id: "finance",
    name: "Finanzas",
    icon: DollarSign,
    color: "from-green-500/10 to-green-500/5 border-green-500/20",
    iconColor: "text-green-500",
  },
  {
    id: "education",
    name: "Educación",
    icon: GraduationCap,
    color: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
    iconColor: "text-indigo-500",
  },
  {
    id: "project_management",
    name: "Gestión",
    icon: Briefcase,
    color: "from-teal-500/10 to-teal-500/5 border-teal-500/20",
    iconColor: "text-teal-500",
  },
]

export function CategoryCarousel() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Link key={category.id} href={`/dashboard?category=${category.id}`}>
            <Card className={`bg-gradient-to-br ${category.color} hover:shadow-md transition-all cursor-pointer`}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`mb-3 ${category.iconColor}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
