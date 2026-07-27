// Script to upload the 5 mock videos to Mux and get playback IDs
// Run with: node scripts/upload-mock-videos-to-mux.mjs

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET environment variables")
  process.exit(1)
}

const AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64")

const videoUrls = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-eKTkMaJJXoGaqtG19D0U6Cnn1bbQ9T.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-DIeYIxvIypnrMdauNAMKaPibAwTxhS.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-IXGnHpUFqmkkTNdWl4HQznmmIxvEeK.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-Gt8YYDXeKcQwUbBGLNA4mfl05vm3Jg.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-YzEw8hXIJsYlS8Zp2OSsh2pT0rJ2t1.mp4",
]

async function createAssetFromUrl(url, index) {
  console.log(`[${index + 1}/5] Uploading: ${url.split("/").pop()}`)
  
  const res = await fetch("https://api.mux.com/video/v1/assets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${AUTH}`,
    },
    body: JSON.stringify({
      input: [{ url }],
      playback_policy: ["public"],
      passthrough: `mock-video-${index + 1}`,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`  Error: ${res.status} - ${errText}`)
    return null
  }

  const data = await res.json()
  const asset = data.data
  console.log(`  Asset ID: ${asset.id}`)
  console.log(`  Playback ID: ${asset.playback_ids?.[0]?.id || "pending..."}`)
  console.log(`  Status: ${asset.status}`)
  
  return {
    asset_id: asset.id,
    playback_id: asset.playback_ids?.[0]?.id || null,
    status: asset.status,
  }
}

async function main() {
  console.log("Starting Mux video uploads...\n")
  
  const results = []
  
  for (let i = 0; i < videoUrls.length; i++) {
    const result = await createAssetFromUrl(videoUrls[i], i)
    if (result) {
      results.push(result)
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log("\n=== RESULTS ===")
  console.log(JSON.stringify(results, null, 2))

  console.log("\n=== PLAYBACK IDS FOR mock-data.ts ===")
  results.forEach((r, i) => {
    console.log(`Video ${i + 1}: playback_id = "${r.playback_id}", asset_id = "${r.asset_id}"`)
  })
}

main().catch(console.error)
