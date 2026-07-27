// Plesk + Phusion Passenger compatible server for Next.js
// Passenger may pass a Unix socket path OR a port number via PORT env var
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

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
