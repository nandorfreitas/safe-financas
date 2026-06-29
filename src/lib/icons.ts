/**
 * Registro central de ícones Font Awesome (pacotes FREE — sem token Pro).
 * O Oren DS espera o componente global `FontAwesomeIcon` e recebe `IconDefinition`
 * já importados (ex.: nos grupos do OrenSidebar).
 */
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faGaugeHigh,
  faRightLeft,
  faWallet,
  faCreditCard,
  faChartLine,
  faTags,
  faCalendarCheck,
  faGear,
  faRightFromBracket,
  faPlus,
  faHandHoldingDollar,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";

export const icons = {
  dashboard: faGaugeHigh,
  transactions: faRightLeft,
  accounts: faWallet,
  cards: faCreditCard,
  loans: faHandHoldingDollar,
  subscriptions: faRepeat,
  investments: faChartLine,
  categories: faTags,
  monthlyReview: faCalendarCheck,
  settings: faGear,
  logout: faRightFromBracket,
  add: faPlus,
};

export function registerIcons() {
  library.add(
    faGaugeHigh,
    faRightLeft,
    faWallet,
    faCreditCard,
    faChartLine,
    faTags,
    faCalendarCheck,
    faGear,
    faRightFromBracket,
    faPlus,
    faHandHoldingDollar,
    faRepeat,
  );
}

export { FontAwesomeIcon };
