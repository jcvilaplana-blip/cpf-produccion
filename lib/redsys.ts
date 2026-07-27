import crypto from "crypto"

// Redsys configuration
const REDSYS_URL_TEST = "https://sis-t.redsys.es:25443/sis/realizarPago"
const REDSYS_URL_PROD = "https://sis.redsys.es/sis/realizarPago"

export interface RedsysConfig {
  merchantCode: string
  terminal: string
  secretKey: string
  environment: "test" | "production"
}

export interface RedsysPaymentParams {
  orderId: string
  amount: number // In cents
  currency?: string // Default: 978 (EUR)
  productDescription: string
  merchantName?: string
  urlOK: string
  urlKO: string
  urlNotification: string
  transactionType?: string // Default: 0 (Authorization)
  consumerLanguage?: string // Default: 001 (Spanish)
}

export interface RedsysNotificationData {
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
}

export interface RedsysMerchantParameters {
  Ds_Date: string
  Ds_Hour: string
  Ds_Amount: string
  Ds_Currency: string
  Ds_Order: string
  Ds_MerchantCode: string
  Ds_Terminal: string
  Ds_Response: string
  Ds_TransactionType: string
  Ds_SecurePayment: string
  Ds_Card_Country: string
  Ds_AuthorisationCode: string
  Ds_ConsumerLanguage: string
  Ds_Card_Type?: string
  Ds_Card_Brand?: string
  Ds_ProcessedPayMethod?: string
  Ds_ExpiryDate?: string
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf-8").toString("base64")
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8")
}

function encrypt3DES(data: string, key: Buffer): Buffer {
  // Redsys uses 3DES-CBC with zero IV
  const iv = Buffer.alloc(8, 0)
  const cipher = crypto.createCipheriv("des-ede3-cbc", key, iv)
  cipher.setAutoPadding(false)
  
  // Pad data to 8-byte boundary
  const dataBuffer = Buffer.from(data, "utf-8")
  const paddingLength = 8 - (dataBuffer.length % 8)
  const paddedData = Buffer.concat([dataBuffer, Buffer.alloc(paddingLength, 0)])
  
  return Buffer.concat([cipher.update(paddedData), cipher.final()])
}

function generateSignature(merchantParams: string, orderKey: Buffer): string {
  const hmac = crypto.createHmac("sha256", orderKey)
  hmac.update(merchantParams)
  return hmac.digest("base64")
}

export function getRedsysConfig(): RedsysConfig {
  return {
    merchantCode: process.env.REDSYS_MERCHANT_CODE || "",
    terminal: process.env.REDSYS_TERMINAL || "00000003",
    secretKey: process.env.REDSYS_SECRET_KEY || "",
    environment: (process.env.REDSYS_ENVIRONMENT || "test") as "test" | "production",
  }
}

export function getRedsysUrl(environment: "test" | "production"): string {
  return environment === "production" ? REDSYS_URL_PROD : REDSYS_URL_TEST
}

export function createRedsysPaymentForm(params: RedsysPaymentParams): {
  url: string
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
} {
  const config = getRedsysConfig()
  
  // Prepare merchant parameters
  const merchantParams = {
    DS_MERCHANT_AMOUNT: params.amount.toString(),
    DS_MERCHANT_ORDER: params.orderId,
    DS_MERCHANT_MERCHANTCODE: config.merchantCode,
    DS_MERCHANT_CURRENCY: params.currency || "978", // EUR
    DS_MERCHANT_TRANSACTIONTYPE: params.transactionType || "0",
    DS_MERCHANT_TERMINAL: config.terminal,
    DS_MERCHANT_MERCHANTURL: params.urlNotification,
    DS_MERCHANT_URLOK: params.urlOK,
    DS_MERCHANT_URLKO: params.urlKO,
    DS_MERCHANT_CONSUMERLANGUAGE: params.consumerLanguage || "001",
    DS_MERCHANT_PRODUCTDESCRIPTION: params.productDescription,
    DS_MERCHANT_MERCHANTNAME: params.merchantName || "CamareroPorFavor",
  }

  // Encode merchant parameters
  const merchantParamsBase64 = base64UrlEncode(JSON.stringify(merchantParams))

  // Generate signature
  const keyBuffer = Buffer.from(config.secretKey, "base64")
  const orderKey = encrypt3DES(params.orderId, keyBuffer)
  const signature = generateSignature(merchantParamsBase64, orderKey)

  return {
    url: getRedsysUrl(config.environment),
    Ds_SignatureVersion: "HMAC_SHA256_V1",
    Ds_MerchantParameters: merchantParamsBase64,
    Ds_Signature: signature,
  }
}

export function verifyRedsysNotification(notification: RedsysNotificationData): {
  valid: boolean
  params: RedsysMerchantParameters | null
  error?: string
} {
  try {
    const config = getRedsysConfig()
    
    // Decode merchant parameters
    const paramsJson = base64UrlDecode(notification.Ds_MerchantParameters)
    const params = JSON.parse(paramsJson) as RedsysMerchantParameters

    // Verify signature
    const keyBuffer = Buffer.from(config.secretKey, "base64")
    const orderKey = encrypt3DES(params.Ds_Order, keyBuffer)
    const expectedSignature = generateSignature(notification.Ds_MerchantParameters, orderKey)
    
    // Compare signatures (base64 comparison, handle URL-safe vs standard)
    const receivedSig = notification.Ds_Signature.replace(/-/g, "+").replace(/_/g, "/")
    const expectedSig = expectedSignature.replace(/-/g, "+").replace(/_/g, "/")
    
    if (receivedSig !== expectedSig) {
      return { valid: false, params: null, error: "Invalid signature" }
    }

    return { valid: true, params }
  } catch (error) {
    return { 
      valid: false, 
      params: null, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

export function isPaymentSuccessful(responseCode: string): boolean {
  // Response codes 0000-0099 indicate success
  const code = parseInt(responseCode, 10)
  return code >= 0 && code <= 99
}

export function getResponseCodeMessage(code: string): string {
  const responseMessages: Record<string, string> = {
    "0000": "Transacción aprobada",
    "0001": "Transacción aprobada previa identificación de titular",
    "0002": "Transacción aprobada",
    "0101": "Tarjeta caducada",
    "0102": "Tarjeta bloqueada o error CVV",
    "0104": "Operación no permitida",
    "0116": "Saldo insuficiente",
    "0118": "Tarjeta no registrada",
    "0129": "Error CVV incorrecto",
    "0180": "Tarjeta no válida",
    "0184": "Error en autenticación",
    "0190": "Denegada sin especificar motivo",
    "0191": "Fecha de caducidad errónea",
    "0202": "Tarjeta bloqueada o error CVV",
    "0904": "Error de sistema",
    "0909": "Error de sistema",
    "0912": "Emisor no disponible",
    "0913": "Pedido repetido",
    "0944": "Sesión incorrecta",
    "0950": "Operación de devolución no permitida",
    "9064": "Número de posiciones de tarjeta incorrecto",
    "9078": "Tipo de operación no permitida",
    "9093": "Tarjeta no existe",
    "9094": "Rechazo emisor",
    "9104": "Comercio no autorizado",
    "9218": "El comercio no permite operaciones seguras",
    "9253": "Tarjeta no cumple check-digit",
    "9256": "Comercio no puede realizar preautorizaciones",
    "9257": "Tarjeta no permite operaciones de preautorización",
    "9915": "A]petición del usuario se ha cancelado el pago",
    "9997": "Transacción simultánea en el TPV",
    "9998": "Operación en proceso de solicitud de datos de tarjeta",
    "9999": "Operación que ha sido redirigida al emisor a autenticar",
  }
  
  return responseMessages[code] || `Código de respuesta: ${code}`
}

// Generate unique order ID for Redsys (12 alphanumeric characters, starts with 4 digits)
export function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return timestamp + random
}
