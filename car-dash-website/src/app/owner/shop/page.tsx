import { ColorChoice, StockGrid } from "./stock-grid";
import SizePicker from "./size-picker";
import "./manager.css";
import Link from "next/link";
import { GuideEditor } from "../../shop/size-guide";
import SaveForm from "./save-form";
import Photo from "./photo";
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
    const bulk = f.has("matrix");
    const sizes = [...new Set(f.getAll("sizes").map(String))];
    const delta = Number(str("delta"));
    if (!str("color")) throw new ShopInputError("Enter a color name.");
    if (bulk && !sizes.length)
      throw new ShopInputError(
        "Choose at least one size for this color. Enter 0 for sizes available by reservation.",
      );
    if (
      !str("name") ||
      !str("color") ||
      (bulk ? !sizes.length : !str("size")) ||
      !str("guide") ||
      !Number.isSafeInteger(cents) ||
      cents < 50 ||
      !Number.isSafeInteger(delta)
    )
      throw new ShopInputError("Check required fields and price.");
    const images = [...new Set(f.getAll("image").map(String).filter(Boolean))];
    if (images.length > 12 || images.some((url) => !/^https:\/\//i.test(url)))
      throw new ShopInputError("Choose up to 12 HTTPS photos.");
    await changeShop((shop) => {
      if (bulk) {
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
              !v.deleted &&
              v.color.toLowerCase() === str("color").toLowerCase(),
          )?.color ?? str("color");
        const source =
          shop.variants.find(
            (v) => !v.deleted && v.name === name && v.color === color,
          ) ?? template;
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
          if (item && previous === item.id + "@" + qty) continue;
          if (previous !== (item ? item.id + "@" + item.stock : ""))
            throw new ShopInputError(
              "Inventory changed. Refresh before setting new quantities.",
            );
          if (item) {
            item.stock = qty;
            allocate(shop, item);
            continue;
          }
          const variant = {
            ...(source ?? {
              description: str("description"),
              guide: str("guide"),
              eta: str("eta"),
              image: images[0] ?? "",
              images,
              published: f.has("published"),
              cents,
            }),
            ...(source && source.color !== color
              ? { image: "", images: [] }
              : {}),
            id: crypto.randomUUID(),
            name,
            color,
            size,
            stock: qty,
          };
          shop.variants.push(variant);
          allocate(shop, variant);
        }
        return;
      }
      const old = shop.variants.find((v) => v.id === str("id"));
      if (str("id") && (!old || old.deleted))
        throw new ShopInputError(
          "This listing was deleted. Refresh the editor.",
        );
      if (
        shop.variants.some(
          (v) =>
            !v.deleted &&
            v.id !== old?.id &&
            [v.name, v.color, v.size].join("|").toLowerCase() ===
              [str("name"), str("color"), str("size")].join("|").toLowerCase(),
        )
      )
        throw new ShopInputError("This variant already exists.");
      if (
        old &&
        shop.orders.some((o) => o.variant === old.id) &&
        (old.color !== str("color") || old.size !== str("size"))
      )
        throw new ShopInputError(
          "Create a new variant to change the size or color after checkout.",
        );
      const stock = (old?.stock ?? 0) + delta;
      if (stock < 0)
        throw new ShopInputError("Stock adjustment exceeds available stock.");
      const v = {
        id: old?.id ?? crypto.randomUUID(),
        name: str("name"),
        description: str("description"),
        color: str("color"),
        size: str("size"),
        guide: str("guide"),
        eta: str("eta"),
        image: images[0] ?? "",
        images,
        published: f.has("published"),
        cents,
        stock,
      };
      const previousImages = old?.images ?? (old?.image ? [old.image] : []);
      if (JSON.stringify(previousImages) !== JSON.stringify(images)) {
        for (const sibling of shop.variants) {
          if (
            !sibling.deleted &&
            sibling.name === v.name &&
            sibling.color === v.color
          ) {
            sibling.image = v.image;
            sibling.images = images;
          }
        }
      }
      if (old) Object.assign(old, v);
      else shop.variants.push(v);
      allocate(shop, old ?? v);
    });
    revalidatePath("/owner/shop");
    revalidatePath("/shop");
    return { ok: true, created: bulk && !str("template"), message: "Saved." };
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
function Editor({ v, colors }: { v?: Variant; colors: string[] }) {
  return (
    <SaveForm save={save} className="grid gap-3 rounded border p-4">
      <input type="hidden" name="id" value={v?.id ?? ""} />
      {!v && (
        <>
          <input type="hidden" name="matrix" value="1" />
          <StockGrid rows={[]} colors={colors} />
        </>
      )}
      {(["name", "color", "size", "description", "eta"] as const).map((k, i) =>
        k === "color" ? (
          v ? (
            <ColorChoice key={k} colors={colors} initial={v.color} />
          ) : null
        ) : k === "size" && !v ? null : k === "size" ? (
          <SizePicker key={k} initial={v?.size} />
        ) : (
          <label key={k}>
            {
              [
                "Product name",
                "Color",
                "Size",
                "Description",
                "Restock estimate",
              ][i]
            }
            <textarea
              className="block w-full rounded border p-2"
              name={k}
              defaultValue={v?.[k]}
              required={["name", "color", "size", "guide"].includes(k)}
            />
          </label>
        ),
      )}
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
      {v && (
        <label>
          Adjust inventory ({v?.stock ?? 0} available){" "}
          <input name="delta" type="number" defaultValue={0} required />
        </label>
      )}
      <label>
        <input type="checkbox" name="published" defaultChecked={v?.published} />{" "}
        Show in shop
      </label>
      <GuideEditor initial={v?.guide ?? ""} />
      <Photo
        saveLabel={v ? "Save variant" : "Create product"}
        initial={v?.images ?? (v?.image ? [v.image] : [])}
      />
    </SaveForm>
  );
}
function ProductStock({ rows, colors }: { rows: Variant[]; colors: string[] }) {
  return (
    <SaveForm save={save} className="grid gap-3 p-4">
      <input type="hidden" name="matrix" value="1" />
      <input type="hidden" name="template" value={rows[0].id} />
      <input type="hidden" name="name" value={rows[0].name} />
      <input type="hidden" name="price" value={rows[0].cents / 100} />
      <input type="hidden" name="guide" value={rows[0].guide} />
      <StockGrid
        key={JSON.stringify(rows.map((v) => [v.id, v.stock, v.color, v.size]))}
        rows={rows}
        colors={colors}
      />
      <button>Save sizes and quantities</button>
    </SaveForm>
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
  const colors = [...new Set(active.map((v) => v.color))];
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
          <Editor colors={colors} />
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
                <summary>Sizes and colors</summary>
                <ProductStock
                  rows={active.filter((v) => v.name === name)}
                  colors={colors}
                />
              </details>
              {variants.map((v) => (
                <details key={v.id} className="mm-variant">
                  <summary>
                    <strong>
                      {v.color} / {v.size}
                    </strong>
                    <span>
                      {v.published ? "Published" : "Draft"} · {v.stock} left
                    </span>
                  </summary>
                  <Editor v={v} colors={colors} />
                  <DeleteControl
                    ids={[v.id]}
                    label={"Delete " + v.color + " / " + v.size}
                  />
                </details>
              ))}
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
              <ProductStock
                rows={active.filter((v) => v.name === name)}
                colors={colors}
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
