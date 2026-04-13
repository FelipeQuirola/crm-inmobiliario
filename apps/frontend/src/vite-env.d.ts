/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TENANT_SLUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
