// ── Estilos base (tokens). Importe também '@oren/design-system/tokens.css'
//    na raiz do seu app, ou confie no bundle de estilos do pacote.
import "./styles/tokens.css";

// ── Componentes
export { default as OrenButton } from "./components/OrenButton.vue";
export { default as OrenBadge } from "./components/OrenBadge.vue";
export { default as OrenAvatar } from "./components/OrenAvatar.vue";
export { default as OrenInput } from "./components/OrenInput.vue";
export { default as OrenTextarea } from "./components/OrenTextarea.vue";
export { default as OrenSelect } from "./components/OrenSelect.vue";
export { default as OrenCheckbox } from "./components/OrenCheckbox.vue";
export { default as OrenRadio } from "./components/OrenRadio.vue";
export { default as OrenToggle } from "./components/OrenToggle.vue";
export { default as OrenAlert } from "./components/OrenAlert.vue";
export { default as OrenProgress } from "./components/OrenProgress.vue";
export { default as OrenSpinner } from "./components/OrenSpinner.vue";
export { default as OrenCard } from "./components/OrenCard.vue";
export { default as OrenModal } from "./components/OrenModal.vue";
export { default as OrenTabs } from "./components/OrenTabs.vue";
export { default as OrenTable } from "./components/OrenTable.vue";
export { default as OrenTooltip } from "./components/OrenTooltip.vue";
export { default as OrenToaster } from "./components/OrenToaster.vue";
export { default as OrenSidebar } from "./components/OrenSidebar.vue";
export { default as OrenPage } from "./components/OrenPage.vue";
export { default as OrenPageHeader } from "./components/OrenPageHeader.vue";
export { default as OrenStatCard } from "./components/OrenStatCard.vue";
export { default as OrenChartCard } from "./components/OrenChartCard.vue";

// ── Composables
export { useToast } from "./useToast";
export type { Toast } from "./useToast";

// ── Tipos
export type {
  Size,
  ButtonVariant,
  BadgeVariant,
  AvatarTone,
  Feedback,
  SelectOption,
  TabItem,
  Column,
  Pillar,
} from "./types";
