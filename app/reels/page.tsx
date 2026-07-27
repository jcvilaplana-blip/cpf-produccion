import { redirect } from "next/navigation"
import { ReelsContent } from "@/components/reels-content"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Video Reels - CamareroPorFavor",
  description: "Descubre el talento de candidatos a traves de sus video-reels profesionales",
}

export default async function ReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ worker?: string }>
}) {
  const { worker } = await searchParams
  const supabase = await createClient()

  // Fetch real workers with Mux video reels
  const { data: workers } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "worker")
    .not("mux_playback_id", "is", null)
    .order("rating", { ascending: false })

  // A requested worker with no video reel isn't in `workers` at all - falling
  // through would silently show whichever reel happens to be first instead
  // (a completely different person's video). Send them to the profile page.
  if (worker && !(workers || []).some((w) => w.id === worker)) {
    redirect(`/profile/${worker}`)
  }

  return <ReelsContent workers={workers || []} hideBottomNav={true} initialWorkerId={worker} />
}
