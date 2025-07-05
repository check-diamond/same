/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INTER_CLIENT_ID: string
  readonly VITE_INTER_CLIENT_SECRET: string
  readonly VITE_INTER_CERTIFICATE_PATH: string
  readonly VITE_4SEND_API_TOKEN: string
  readonly VITE_PIX_DEFAULT_PROVIDER: string
  readonly VITE_EMAILJS_SERVICE_ID: string
  readonly VITE_EMAILJS_TEMPLATE_ID: string
  readonly VITE_EMAILJS_PUBLIC_KEY: string
  readonly VITE_EMAIL_WEBHOOK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
