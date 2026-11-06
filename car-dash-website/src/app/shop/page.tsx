import { readShop } from "@/lib/shop";
import Catalog from "./catalog";
export const dynamic = "force-dynamic";
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ received?: string }>;
}) {
  const rows = (await readShop()).variants.filter((v) => v.published);
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="mb-8 text-5xl font-bold">Car Dash apparel</h1>
      {(await searchParams).received && (
        <p>
          Thanks for checking out. Keep your Stripe receipt for your records.
        </p>
      )}
      {rows.length ? (
        <Catalog rows={rows} />
      ) : (
        <p>The first drop is on its way. Check back for sizes and colors.</p>
      )}
    </main>
  );
}
