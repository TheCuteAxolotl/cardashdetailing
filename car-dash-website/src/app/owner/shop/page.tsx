import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  allocate,
  changeShop,
  readShop,
  reconcile,
  type Variant,
} from "@/lib/shop";
export const dynamic = "force-dynamic";
async function owner() {
  if ((await getCurrentUser())?.role !== "owner") redirect("/login");
}
async function save(f: FormData) {
  "use server";
  await owner();
  const str = (key: string) => String(f.get(key) ?? "").trim();
  const cents = Math.round(Number(str("price")) * 100);
  const delta = Number(str("delta"));
  if (
    !str("name") ||
    !str("color") ||
    !str("size") ||
    !str("guide") ||
    !Number.isSafeInteger(cents) ||
    cents < 50 ||
    !Number.isSafeInteger(delta)
  )
    throw Error("Check required fields and price.");
  if (str("image") && !/^https:\/\//i.test(str("image")))
    throw Error("Use an HTTPS photo URL.");
  await changeShop((shop) => {
    const old = shop.variants.find((v) => v.id === str("id"));
    if (
      shop.variants.some(
        (v) =>
          v.id !== old?.id &&
          [v.name, v.color, v.size].join("|").toLowerCase() ===
            [str("name"), str("color"), str("size")].join("|").toLowerCase(),
      )
    )
      throw Error("This variant already exists.");
    if (
      old &&
      shop.orders.some((o) => o.variant === old.id) &&
      (old.color !== str("color") || old.size !== str("size"))
    )
      throw Error(
        "Create a new variant to change the size or color after checkout.",
      );
    const stock = (old?.stock ?? 0) + delta;
    if (stock < 0) throw Error("Stock adjustment exceeds available stock.");
    const v = {
      id: old?.id ?? crypto.randomUUID(),
      name: str("name"),
      description: str("description"),
      color: str("color"),
      size: str("size"),
      guide: str("guide"),
      eta: str("eta"),
      image: str("image"),
      published: f.has("published"),
      cents,
      stock,
    };
    if (old) Object.assign(old, v);
    else shop.variants.push(v);
    allocate(shop, old ?? v);
  });
  revalidatePath("/owner/shop");
  revalidatePath("/shop");
}
function Editor({ v }: { v?: Variant }) {
  return (
    <form action={save} className="grid gap-3 rounded border p-4">
      <input type="hidden" name="id" value={v?.id ?? ""} />
      {(
        [
          "name",
          "color",
          "size",
          "description",
          "guide",
          "eta",
          "image",
        ] as const
      ).map((k, i) => (
        <label key={k}>
          {
            [
              "Product name",
              "Color",
              "Size",
              "Description",
              "Size guide (include units)",
              "Restock estimate",
              "Product photo URL",
            ][i]
          }
          <textarea
            className="block w-full rounded border p-2"
            name={k}
            defaultValue={v?.[k]}
            required={["name", "color", "size", "guide"].includes(k)}
          />
        </label>
      ))}
      <label>
        Price including US shipping ($){" "}
        <input
          name="price"
          type="number"
          step=".01"
          min=".50"
          defaultValue={v ? v.cents / 100 : undefined}
          required
        />
      </label>
      <label>
        Adjust inventory ({v?.stock ?? 0} available){" "}
        <input name="delta" type="number" defaultValue={0} required />
      </label>
      <label>
        <input type="checkbox" name="published" defaultChecked={v?.published} />{" "}
        Show in shop
      </label>
      <button>Save variant</button>
    </form>
  );
}
export default async function Manager() {
  await owner();
  const shop = await readShop();
  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <h1 className="text-3xl font-bold">Merch shop</h1>
      <details>
        <summary>Add a size and color</summary>
        <Editor />
      </details>
      {shop.variants.map((v) => (
        <details key={v.id}>
          <summary>
            {v.name} · {v.color} · {v.size} · {v.stock} available
          </summary>
          <Editor v={v} />
        </details>
      ))}
      <h2>Merch orders</h2>
      <form
        action={async () => {
          "use server";
          await owner();
          await reconcile();
          revalidatePath("/owner/shop");
        }}
      >
        <button>Sync payments and expired checkouts</button>
      </form>
      {shop.orders
        .filter((o) => ["reserved", "ready", "shipped"].includes(o.status))
        .reverse()
        .map((o) => (
          <article className="rounded border p-3" key={o.id}>
            <strong>{o.item}</strong>
            <p>
              {o.status === "ready"
                ? "Ready to ship"
                : o.status === "reserved"
                  ? "Paid · awaiting restock"
                  : "Shipped"}{" "}
              · ${(o.cents / 100).toFixed(2)}
            </p>
            <p>{o.recipient}</p>
            {o.tracking}
            <form
              action={async (f) => {
                "use server";
                await owner();
                const tracking = String(f.get("tracking") ?? "").trim();
                if (!tracking) throw Error("Enter tracking.");
                await changeShop((s) => {
                  const order = s.orders.find((x) => x.id === o.id);
                  if (order?.status === "ready") {
                    order.tracking = tracking;
                    order.status = "shipped";
                  }
                });
                revalidatePath("/owner/shop");
              }}
            >
              {o.status === "ready" && (
                <>
                  <input
                    name="tracking"
                    placeholder="Carrier and tracking number"
                    required
                  />
                  <button>Mark shipped</button>
                </>
              )}
            </form>
          </article>
        ))}
    </main>
  );
}
