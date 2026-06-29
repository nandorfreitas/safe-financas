import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/AppShell.vue"),
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("@/views/DashboardView.vue"),
      },
      {
        path: "transacoes",
        name: "transactions",
        component: () => import("@/views/TransactionsView.vue"),
      },
      {
        path: "contas",
        name: "accounts",
        component: () => import("@/views/AccountsView.vue"),
      },
      {
        path: "cartoes",
        name: "cards",
        component: () => import("@/views/CardsView.vue"),
      },
      {
        path: "cartoes/:cardId",
        name: "card-detail",
        component: () => import("@/views/CardDetailView.vue"),
      },
      {
        path: "emprestimos",
        name: "loans",
        component: () => import("@/views/LoansView.vue"),
      },
      {
        path: "emprestimos/:loanId",
        name: "loan-detail",
        component: () => import("@/views/LoanDetailView.vue"),
      },
      {
        path: "assinaturas",
        name: "subscriptions",
        component: () => import("@/views/SubscriptionsView.vue"),
      },
      {
        path: "investimentos",
        name: "investments",
        component: () => import("@/views/InvestmentsView.vue"),
      },
      {
        path: "categorias",
        name: "categories",
        component: () => import("@/views/CategoriesView.vue"),
      },
      {
        path: "fechamento",
        name: "monthly-review",
        component: () => import("@/views/MonthlyReviewView.vue"),
      },
      {
        path: "configuracoes",
        name: "settings",
        component: () => import("@/views/SettingsView.vue"),
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  // Garante que o estado de auth já foi resolvido antes de decidir.
  if (!authStore.ready) await authStore.init();

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.name === "login" && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }
  return true;
});
