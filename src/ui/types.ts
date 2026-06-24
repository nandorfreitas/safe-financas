// Tipos públicos compartilhados pelos componentes Oren.

export type Pillar = "payments" | "capital" | "governance";

export type Size = "sm" | "md" | "lg";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "accent"
  | "danger";

export type BadgeVariant =
  | "soft"
  | "accent"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

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
