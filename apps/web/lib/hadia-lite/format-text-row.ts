/** HadiaLink — Hadiah Link lite text rows (browser-safe; isolated from BNHub/marketplace). */

export type HadialinkLiteRow = {
  id: string;
  title: string;
  /** Display price like "499 SYP" */
  price: string;
  /** Whether the item is nominally purchasable / in stock */
  available: boolean;
};

export function formatHadialinkLiteLine(row: HadialinkLiteRow, localeStartsWithAr: boolean): string {
  const stock = row.available ?
    localeStartsWithAr ? "متاح"
  : "in stock"
  : localeStartsWithAr ?
    "غير متاح"
  : "out of stock";

  return `${row.title} · ${row.price} · ${stock}`;
}
