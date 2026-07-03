/**
 * Referências tipadas do Firestore, escopadas no workspace ativo.
 * Um converter genérico injeta o `id` do documento ao ler e o remove ao gravar.
 */
import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { db } from "@/firebase";
import type {
  Account,
  Card,
  Category,
  CategoryHint,
  Invoice,
  Loan,
  MonthlyReview,
  Subscription,
  Transaction,
} from "@/types/models";

/** Converter genérico: lê com `id`, grava sem `id`. */
function withId<T extends { id?: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data) {
      const { id: _ignored, ...rest } = data as T;
      void _ignored;
      return rest;
    },
    fromFirestore(snapshot, options) {
      return { id: snapshot.id, ...(snapshot.data(options) as Omit<T, "id">) } as T;
    },
  };
}

const accountConverter = withId<Account>();
const cardConverter = withId<Card>();
const invoiceConverter = withId<Invoice>();
const loanConverter = withId<Loan>();
const subscriptionConverter = withId<Subscription>();
const categoryConverter = withId<Category>();
const categoryHintConverter = withId<CategoryHint>();
const transactionConverter = withId<Transaction>();
const reviewConverter = withId<MonthlyReview>();

const base = (wsId: string) => `workspaces/${wsId}`;

export function accountsRef(wsId: string): CollectionReference<Account> {
  return collection(db, `${base(wsId)}/accounts`).withConverter(accountConverter);
}
export function accountRef(wsId: string, id: string): DocumentReference<Account> {
  return doc(db, `${base(wsId)}/accounts/${id}`).withConverter(accountConverter);
}

export function cardsRef(wsId: string): CollectionReference<Card> {
  return collection(db, `${base(wsId)}/cards`).withConverter(cardConverter);
}
export function cardRef(wsId: string, id: string): DocumentReference<Card> {
  return doc(db, `${base(wsId)}/cards/${id}`).withConverter(cardConverter);
}

export function invoicesRef(wsId: string, cardId: string): CollectionReference<Invoice> {
  return collection(db, `${base(wsId)}/cards/${cardId}/invoices`).withConverter(
    invoiceConverter,
  );
}
export function invoiceRef(
  wsId: string,
  cardId: string,
  id: string,
): DocumentReference<Invoice> {
  return doc(db, `${base(wsId)}/cards/${cardId}/invoices/${id}`).withConverter(
    invoiceConverter,
  );
}

export function loansRef(wsId: string): CollectionReference<Loan> {
  return collection(db, `${base(wsId)}/loans`).withConverter(loanConverter);
}
export function loanRef(wsId: string, id: string): DocumentReference<Loan> {
  return doc(db, `${base(wsId)}/loans/${id}`).withConverter(loanConverter);
}

export function subscriptionsRef(wsId: string): CollectionReference<Subscription> {
  return collection(db, `${base(wsId)}/subscriptions`).withConverter(
    subscriptionConverter,
  );
}
export function subscriptionRef(wsId: string, id: string): DocumentReference<Subscription> {
  return doc(db, `${base(wsId)}/subscriptions/${id}`).withConverter(
    subscriptionConverter,
  );
}

export function categoriesRef(wsId: string): CollectionReference<Category> {
  return collection(db, `${base(wsId)}/categories`).withConverter(categoryConverter);
}
export function categoryRef(wsId: string, id: string): DocumentReference<Category> {
  return doc(db, `${base(wsId)}/categories/${id}`).withConverter(categoryConverter);
}

export function categoryHintsRef(wsId: string): CollectionReference<CategoryHint> {
  return collection(db, `${base(wsId)}/categoryHints`).withConverter(categoryHintConverter);
}
export function categoryHintRef(wsId: string, key: string): DocumentReference<CategoryHint> {
  return doc(db, `${base(wsId)}/categoryHints/${key}`).withConverter(categoryHintConverter);
}

export function transactionsRef(wsId: string): CollectionReference<Transaction> {
  return collection(db, `${base(wsId)}/transactions`).withConverter(
    transactionConverter,
  );
}
export function transactionRef(wsId: string, id: string): DocumentReference<Transaction> {
  return doc(db, `${base(wsId)}/transactions/${id}`).withConverter(transactionConverter);
}

export function reviewsRef(wsId: string): CollectionReference<MonthlyReview> {
  return collection(db, `${base(wsId)}/monthlyReviews`).withConverter(reviewConverter);
}
export function reviewRef(wsId: string, competencia: string): DocumentReference<MonthlyReview> {
  return doc(db, `${base(wsId)}/monthlyReviews/${competencia}`).withConverter(
    reviewConverter,
  );
}
