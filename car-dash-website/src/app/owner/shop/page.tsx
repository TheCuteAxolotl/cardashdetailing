import ProductEditor from "./product-editor";
import "./manager.css";
import Link from "next/link";
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
class ShopInputError extends Error {}
async function save(f: FormData) {
  "use server";
  await owner();
  try {
    const str = (key: string) => String(f.get(key) ?? "").trim();
    const cents = Math.round(Number(str("price")) * 100);
    const sizes = [...new Set(f.getAll("sizes").map(String))];
    if (!str("color")) throw new ShopInputError("Enter a color name.");
    if (!sizes.length)
      throw new ShopInputError(
        "Choose at least one size for this color. Enter 0 for sizes available by reservation.",
      );
    if (
      !str("name") ||
      !str("color") ||
      !str("guide") ||
      !Number.isSafeInteger(cents) ||
      cents < 50
    )
      throw new ShopInputError("Check required fields and price.");
    const images = [...new Set(f.getAll("image").map(String).filter(Boolean))];
    if (images.length > 12 || images.some((url) => !/^https:\/\//i.test(url)))
      throw new ShopInputError("Choose up to 12 HTTPS photos.");
    await changeShop((shop) => {
      const templateId = str("template");
      const template = shop.variants.find(
        (v) => v.id === templateId && !v.deleted,
      );
      if (templateId && !template)
        throw new ShopInputError("Product changed. Refresh and try again.");
      const name = template?.name ?? str("name");
      if (
        !template &&
        shop.variants.some(
          (v) => !v.deleted && v.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new ShopInputError(
          "Product already exists. Open its Sizes and colors editor.",
        );
      const color =
        shop.variants.find(
          (v) =>
            !v.deleted && v.color.toLowerCase() === str("color").toLowerCase(),
        )?.color ?? str("color");
      const details = {
        description: str("description"),
        eta: str("eta"),
        guide: str("guide"),
        cents,
        image: images[0] ?? "",
        images,
        published: f.has("published"),
      };
      if (
        f.has("newColor") &&
        shop.variants.some(
          (v) =>
            !v.deleted &&
            v.name === name &&
            v.color.toLowerCase() === color.toLowerCase(),
        )
      )
        throw new ShopInputError(
          "That color already exists. Select it to edit its photos and quantities.",
        );
      for (const size of sizes) {
        const item = shop.variants.find(
          (v) =>
            !v.deleted &&
            v.name === name &&
            v.color === color &&
            v.size === size,
        );
        const raw = str("qty:" + size),
          qty = Number(raw),
          previous = str("previous:" + size);
        if (!raw || !Number.isSafeInteger(qty) || qty < 0)
          throw new ShopInputError(
            "Enter a nonnegative quantity for each selected size.",
          );
        if (item && previous === item.id + "@" + qty) {
          Object.assign(item, details);
          continue;
        }
        if (previous !== (item ? item.id + "@" + item.stock : ""))
          throw new ShopInputError(
            "Inventory changed. Refresh before setting new quantities.",
          );
        if (item) {
          Object.assign(item, details);
          item.stock = qty;
          allocate(shop, item);
          continue;
        }
        const variant = {
          ...details,
          id: crypto.randomUUID(),
          name,
          color,
          size,
          stock: qty,
        };
        shop.variants.push(variant);
        allocate(shop, variant);
      }
    });
    revalidatePath("/owner/shop");
    revalidatePath("/shop");
    return { ok: true, created: !str("template"), message: "Saved." };
  } catch (error) {
    return {
      ok: false,
      created: false,
      message:
        error instanceof ShopInputError
          ? error.message
          : "Could not save your changes. Your entries are still here. Try again.",
    };
  }
}
async function remove(ids: string[]) {
  "use server";
  await owner();
  await changeShop((shop) => {
    const selected = new Set(ids);
    shop.variants = shop.variants.filter((v) => {
      if (!selected.has(v.id)) return true;
      if (
        !shop.orders.some(
          (o) =>
            o.variant === v.id && ["checkout", "reserved"].includes(o.status),
        )
      )
        return false;
      v.published = false;
      v.deleted = true;
      return true;
    });
  });
  revalidatePath("/shop");
  revalidatePath("/owner/shop");
}
function DeleteControl({ ids, label }: { ids: string[]; label: string }) {
  return (
    <details className="my-3">
      <summary className="cursor-pointer text-red-400">{label}</summary>
      <form action={remove.bind(null, ids)} className="mt-2">
        <p>Remove this from the shop? Existing orders stay in Merch orders.</p>
        <button className="mt-2 rounded bg-red-700 px-4 py-2 text-white">
          Confirm deletion
        </button>
      </form>
    </details>
  );
}
export default async function Manager({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  await owner();
  const shop = await readShop();
  const params = await searchParams;
  const view = ["inventory", "orders", "new"].includes(params.view ?? "")
    ? params.view
    : "products";
  const query = (params.q ?? "").trim().toLowerCase();
  const active = shop.variants.filter((v) => !v.deleted);
  const matches = active.filter((v) =>
    [v.name, v.color, v.size].join(" ").toLowerCase().includes(query),
  );
  const names = [...new Set(matches.map((v) => v.name))];
  return (
    <main className="merch-manager">
      <header>
        <div>
          <h1>Shop manager</h1>
          <Link href="/shop">View storefront ↗</Link>
        </div>
        <Link className="mm-primary" href="?view=new">
          + Add product
        </Link>
      </header>
      <nav aria-label="Shop management">
        {["products", "inventory", "orders"].map((key) => (
          <Link
            key={key}
            href={"?view=" + key}
            aria-current={view === key ? "page" : undefined}
          >
            {key}
          </Link>
        ))}
      </nav>
      {view === "new" && (
        <section>
          <h2>Add a product</h2>
          <ProductEditor rows={[]} save={save} />
        </section>
      )}
      {(view === "products" || view === "inventory") && (
        <>
          <form className="mm-search">
            <input type="hidden" name="view" value={view} />
            <input
              aria-label="Search by product, color or size"
              name="q"
              defaultValue={params.q}
              placeholder="Search product, color or size"
            />
            <button>Search</button>
          </form>
          {!matches.length && (
            <p>
              {query
                ? "No matching variants."
                : "Your catalog is empty. Add a variant to get started."}
            </p>
          )}
        </>
      )}
      {view === "products" &&
        names.map((name) => {
          const variants = matches.filter((v) => v.name === name);
          const cover = variants.find((v) => v.image)?.image;
          return (
            <section className="mm-product" key={name}>
              <div className="mm-title">
                {cover && <img src={cover} alt="" />}
                <h2>{name}</h2>
              </div>
              <details>
                <summary>Edit product</summary>
                <ProductEditor
                  save={save}
                  rows={active.filter((v) => v.name === name)}
                />
              </details>
              <details>
                <summary>Remove a size</summary>
                {variants.map((v) => (
                  <DeleteControl
                    key={v.id}
                    ids={[v.id]}
                    label={v.color + " / " + v.size}
                  />
                ))}
              </details>
              <DeleteControl
                ids={active.filter((v) => v.name === name).map((v) => v.id)}
                label={"Delete entire product · " + name}
              />
            </section>
          );
        })}
      {view === "inventory" && (
        <>
          {names.map((name) => (
            <section key={name} className="mm-product">
              <h2>{name}</h2>
              <ProductEditor
                save={save}
                rows={active.filter((v) => v.name === name)}
              />
            </section>
          ))}
          {shop.variants
            .filter(
              (v) =>
                v.deleted &&
                shop.orders.some(
                  (o) => o.variant === v.id && o.status === "reserved",
                ),
            )
            .map((v) => (
              <form
                key={v.id}
                action={async (f) => {
                  "use server";
                  await owner();
                  const qty = Number(f.get("qty"));
                  if (!Number.isSafeInteger(qty) || qty < 1)
                    throw Error("Enter a positive quantity.");
                  await changeShop((s) => {
                    const item = s.variants.find(
                      (x) => x.id === v.id && x.deleted,
                    );
                    if (item) {
                      item.stock += qty;
                      allocate(s, item);
                    }
                  });
                  revalidatePath("/owner/shop");
                }}
              >
                <label>
                  Restock deleted listing for paid reservations · {v.name} /{" "}
                  {v.color} / {v.size}{" "}
                  <input name="qty" type="number" min="1" required />
                </label>
                <button>Allocate stock</button>
              </form>
            ))}
        </>
      )}
      {view === "orders" && (
        <>
          <h2>Merch orders</h2>
          {!shop.orders.some((o) =>
            ["reserved", "ready", "shipped"].includes(o.status),
          ) && <p>No paid orders yet.</p>}
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
        </>
      )}
    </main>
  );
}
