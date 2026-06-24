import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

// O Oren Design System é consumido direto do código-fonte (monorepo lado a lado),
// evitando build/publish do pacote. Só `vue` é compartilhado — o alias aponta para
// o barrel `src/index.ts`. Os ícones Font Awesome usados aqui são os pacotes FREE,
// portanto não é necessário o token Pro.
const orenSrc = resolve(__dirname, "../oren-design-system/src");

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ["vue"],
    alias: {
      "@": resolve(__dirname, "src"),
      "@oren/design-system": resolve(orenSrc, "index.ts"),
      // O source do DS vive fora da raiz deste projeto, então suas importações
      // bare (Vue, Font Awesome) não enxergam o node_modules daqui. Resolvemos
      // explicitamente para os pacotes instalados neste app.
      vue: resolve(__dirname, "node_modules/vue"),
      "@fortawesome/vue-fontawesome": resolve(
        __dirname,
        "node_modules/@fortawesome/vue-fontawesome",
      ),
      "@fortawesome/fontawesome-svg-core": resolve(
        __dirname,
        "node_modules/@fortawesome/fontawesome-svg-core",
      ),
    },
  },
  server: {
    port: 5173,
  },
});
