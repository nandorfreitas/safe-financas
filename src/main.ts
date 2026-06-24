import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { registerIcons, FontAwesomeIcon } from "./lib/icons";

// Estilos base do app. Os tokens da marca Oren são carregados como efeito
// colateral pelo barrel do design system (src/index.ts → ./styles/tokens.css).
import "./assets/main.css";

async function bootstrap() {
  const app = createApp(App);

  app.use(createPinia());
  registerIcons();
  app.component("FontAwesomeIcon", FontAwesomeIcon);

  // Resolve o estado de autenticação antes de montar para evitar flicker.
  const authStore = useAuthStore();
  await authStore.init();

  app.use(router);
  app.mount("#app");
}

bootstrap();
