import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import type { ColorValue } from "react-native";

import { palette } from "@/constants/colors";

// SF Symbols on iOS, Material Symbols on Android/web.
const sym = (ios: SFSymbol, android: AndroidSymbol) => ({ ios, android, web: android });

const ICONS = {
  home: sym("house", "home"),
  homeFill: sym("house.fill", "home"),
  chart: sym("chart.pie", "pie_chart"),
  chartFill: sym("chart.pie.fill", "pie_chart"),
  scan: sym("qrcode.viewfinder", "qr_code_scanner"),
  chat: sym("bubble.left", "chat_bubble"),
  chatFill: sym("bubble.left.fill", "chat_bubble"),
  person: sym("person", "person"),
  personFill: sym("person.fill", "person"),
  back: sym("chevron.left", "arrow_back_ios_new"),
  chevronRight: sym("chevron.right", "chevron_right"),
  chevronDown: sym("chevron.down", "expand_more"),
  arrowRight: sym("arrow.right", "arrow_forward"),
  edit: sym("square.and.pencil", "edit_square"),
  moon: sym("moon.fill", "dark_mode"),
  bank: sym("building.columns.fill", "account_balance"),
  transaction: sym("arrow.left.arrow.right", "swap_horiz"),
  settings: sym("gearshape.fill", "settings"),
  privacy: sym("lock.shield.fill", "security"),
  help: sym("questionmark.circle.fill", "help"),
  logout: sym("rectangle.portrait.and.arrow.right", "logout"),
  trophy: sym("trophy", "emoji_events"),
  bell: sym("bell", "notifications"),
  search: sym("magnifyingglass", "search"),
  send: sym("arrow.up.circle.fill", "arrow_circle_up"),
  request: sym("arrow.down.circle.fill", "arrow_circle_down"),
  wallet: sym("wallet.pass.fill", "account_balance_wallet"),
  spending: sym("creditcard.fill", "credit_card"),
  income: sym("banknote.fill", "payments"),
  bills: sym("doc.text.fill", "receipt_long"),
  savings: sym("dollarsign.circle.fill", "savings"),
  warning: sym("exclamationmark.triangle.fill", "warning"),
  globe: sym("globe", "public"),
  sparkle: sym("sparkle", "auto_awesome"),
  bolt: sym("bolt.fill", "bolt"),
  close: sym("xmark", "close"),
  backspace: sym("delete.left", "backspace"),
  check: sym("checkmark", "check"),
  checkCircle: sym("checkmark.circle.fill", "check_circle"),
  errorCircle: sym("xmark.circle.fill", "cancel"),
  clock: sym("clock.fill", "schedule"),
  lock: sym("lock.fill", "lock"),
  minus: sym("minus", "remove"),
  plus: sym("plus", "add"),
  share: sym("square.and.arrow.up", "share"),
  download: sym("arrow.down.to.line", "download"),
  copy: sym("doc.on.doc", "content_copy"),
  reversed: sym("arrow.uturn.backward.circle.fill", "undo"),
  filter: sym("line.3.horizontal.decrease", "filter_list"),
  eye: sym("eye", "visibility"),
  eyeOff: sym("eye.slash", "visibility_off"),
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
};

export function Icon({ name, size = 22, color = palette.text }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
