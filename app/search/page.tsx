import { createClient } from "@/lib/supabase/server"
import { SearchWizardContent } from "@/components/search-wizard-content"


export const metadata = {
  title: "Buscador - CamareroPorFavor",
  description: "Busca ofertas de empleo, candidatos y empresas en CamareroPorFavor",
}

export default async function SearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return <SearchWizardContent profile={profile} />
}
