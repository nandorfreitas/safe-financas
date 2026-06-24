import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  /** false até o primeiro disparo de onAuthStateChanged. */
  const ready = ref(false);

  const isAuthenticated = computed(() => user.value !== null);
  const uid = computed(() => user.value?.uid ?? null);

  /** Liga o listener de sessão. Resolve assim que o estado inicial é conhecido. */
  function init(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => {
        user.value = u;
        if (!ready.value) {
          ready.value = true;
          resolve();
        }
      });
    });
  }

  async function loginWithEmail(email: string, senha: string) {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function registerWithEmail(email: string, senha: string) {
    await createUserWithEmailAndPassword(auth, email, senha);
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  return {
    user,
    ready,
    isAuthenticated,
    uid,
    init,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
  };
});
