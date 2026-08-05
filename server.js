// Plesk + Phusion Passenger compatible server for Next.js
// Passenger may pass a Unix socket path OR a port number via PORT env var
const { createServer } = require('http')
const { parse } = require('url')
const fs = require('fs')
const path = require('path')
const next = require('next')

// Passenger pipes stdout/stderr into a root-owned process, so the site owner
// cannot read them over SSH. Next only ships a `digest` to the browser in
// production, which makes server errors impossible to diagnose. Mirror the
// streams into a file we can actually read. This runs before Next loads and is
// never touched by webpack, so it cannot break the build.
try {
  const logDir = path.join(__dirname, 'logs')
  fs.mkdirSync(logDir, { recursive: true })
  const logFile = path.join(logDir, 'app-errors.log')

  // Keep it bounded: start fresh once it grows past ~5 MB.
  try {
    if (fs.statSync(logFile).size > 5 * 1024 * 1024) fs.truncateSync(logFile, 0)
  } catch (_) { /* file may not exist yet */ }

  const logStream = fs.createWriteStream(logFile, { flags: 'a' })
  logStream.on('error', () => { /* never let logging take the app down */ })

  for (const stream of [process.stdout, process.stderr]) {
    const original = stream.write.bind(stream)
    stream.write = (chunk, encoding, callback) => {
      try { logStream.write(chunk) } catch (_) { /* ignore */ }
      return original(chunk, encoding, callback)
    }
  }
  logStream.write(`\n===== server start ${new Date().toISOString()} =====\n`)
} catch (_) {
  // Diagnostics are optional; the server must start regardless.
}

const dev = false
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Phusion Passenger passes a socket path like "unix:/tmp/passenger.xxx/socket"
  // or a numeric port. We must handle both cases.
  const portEnv = process.env.PORT
  if (portEnv && isNaN(portEnv)) {
    // It's a socket path (Passenger mode)
    server.listen(portEnv, () => {
      console.log('> Next.js ready on socket ' + portEnv)
    })
  } else {
    // It's a numeric port or not set
    const port = parseInt(portEnv, 10) || 3000
    server.listen(port, '0.0.0.0', () => {
      console.log('> Next.js ready on http://0.0.0.0:' + port)
    })
  }
})
