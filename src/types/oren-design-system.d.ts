/**
 * Declaração de módulo para o Oren Design System.
 *
 * Em runtime, o Vite resolve "@oren/design-system" para o código-fonte do pacote
 * vizinho (ver alias em vite.config.ts). Para o type-check, NÃO seguimos aquele
 * source (ele não tem `node_modules`/transform de macros próprio quando compilado
 * de fora) — usamos esta declaração ambiente. Quando o DS publicar `dist` com
 * tipos `.d.ts`, troque o alias por uma dependência real e remova este arquivo.
 */
declare module "@oren/design-system" {
  import type { DefineComponent } from "vue";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type C = DefineComponent<any, any, any>;

  export const OrenButton: C;
  export const OrenBadge: C;
  export const OrenAvatar: C;
  export const OrenInput: C;
  export const OrenTextarea: C;
  export const OrenSelect: C;
  export const OrenCheckbox: C;
  export const OrenRadio: C;
  export const OrenToggle: C;
  export const OrenAlert: C;
  export const OrenProgress: C;
  export const OrenSpinner: C;
  export const OrenCard: C;
  export const OrenModal: C;
  export const OrenTabs: C;
  export const OrenTable: C;
  export const OrenTooltip: C;
  export const OrenToaster: C;
  export const OrenSidebar: C;
  export const OrenPage: C;
  export const OrenPageHeader: C;
  export const OrenStatCard: C;
  export const OrenChartCard: C;

  export interface Toast {
    id: number;
    message: string;
    feedback: "success" | "error" | "warning" | "info";
  }
  export function useToast(): {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };

  export type Size = "sm" | "md" | "lg";
  export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "danger";
  export type BadgeVariant =
    | "soft" | "accent" | "success" | "error" | "warning" | "info" | "neutral";
  export type AvatarTone = "primary" | "soft" | "light";
  export type Feedback = "success" | "error" | "warning" | "info";
  export interface SelectOption {
    label: string;
    value: string | number;
  }
  export interface TabItem {
    label: string;
    value: string;
  }
  export interface Column<T = Record<string, unknown>> {
    key: keyof T & string;
    label: string;
  }
  export type Pillar = "payments" | "capital" | "governance";
}

declare module "@oren/design-system/tokens.css";
