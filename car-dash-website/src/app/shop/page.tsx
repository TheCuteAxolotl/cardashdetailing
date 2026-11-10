import { readShop } from "@/lib/shop";
import "./store.css";
import StoreRefresh from "./store-refresh";
import Catalog from "./catalog";
export const dynamic = "force-dynamic";
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ received?: string }>;
}) {
  const rows = (await readShop()).variants.filter((v) => v.published);
  return (
    <div className="merch-store">
      <StoreRefresh/>
      <header>
        <a href="/" aria-label="Car Dash home">
          CAR DASH
        </a>
        <a href="/">Detailing site ↗</a>
      </header>
      <main>
        <h1>Apparel</h1>
        {(await searchParams).received && (
          <p>
            Thanks for your order! Once Stripe confirms payment, Car Dash will prepare it for shipping to the address you provided. Keep your payment receipt.
          </p>
        )}
        {rows.length ? (
          <Catalog rows={rows} />
        ) : (
          <p>The first drop is on its way. Check back for sizes and colors.</p>
        )}
      </main>
      <footer>
        <a href="/">Car Dash Detailing</a>
        <a href="/contact">Contact</a>
      </footer>
    </div>
  );
}
