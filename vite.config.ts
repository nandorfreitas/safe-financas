import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

// O design system foi internalizado em `src/ui` (consumido via "@/ui").
// Não há mais dependência de repositório externo nem aliases de peer-deps.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ["vue"],
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    // Permite que o signInWithPopup (Firebase Auth) monitore a janela do popup.
    // Sem isto, a COOP padrão bloqueia `window.closed` e o popup pode travar.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
