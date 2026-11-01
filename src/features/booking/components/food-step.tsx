"use client";

import { Minus, Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { PRODUCT_CATEGORIES, type Product } from "@/features/booking/types";
import { useLocale, useT } from "@/i18n";
import { formatVnd } from "@/lib/format";

/** Backend limit per product line. */
export const MAX_PRODUCT_QUANTITY = 20;

/** Snack step: products on sale grouped by category, each with a quantity stepper (docs/ui-design.md §4.3). */
export function FoodStep({
  products,
  quantities,
  onChange,
}: {
  products: Product[];
  quantities: Record<number, number>;
  onChange: (productId: number, quantity: number) => void;
}) {
  const t = useT();
  const groups = PRODUCT_CATEGORIES.map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="food-title">
      <div>
        <h1 id="food-title" className="text-h6">
          {t.booking.foodTitle}
        </h1>
        <p className="mt-1 text-sm font-medium text-fg-muted">{t.booking.foodHint}</p>
      </div>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-wide text-fg-muted uppercase">{t.booking.category[group.category]}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {group.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.id] ?? 0}
                onChange={(quantity) => onChange(product.id, quantity)}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function ProductCard({ product, quantity, onChange }: { product: Product; quantity: number; onChange: (quantity: number) => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  return (
    <li
      className={`flex gap-3 rounded-xl border p-3 transition-colors ${quantity > 0 ? "border-primary bg-primary/5" : "border-line bg-surface-2"}`}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-3">
        <CoverImage src={product.imageUrl} alt={product.name} sizes="80px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-bold">{product.name}</p>
        {product.description && <p className="line-clamp-2 text-xs font-medium text-fg-muted">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-bold text-accent">{formatVnd(product.price, intlLocale)}</span>
          <div className="flex items-center gap-1" role="group" aria-label={t.booking.quantity(product.name)}>
            <StepButton label={t.booking.decrease(product.name)} disabled={quantity === 0} onClick={() => onChange(quantity - 1)}>
              <Minus aria-hidden className="size-4" />
            </StepButton>
            <output aria-live="polite" className="w-7 text-center text-sm font-bold tabular-nums">
              {quantity}
            </output>
            <StepButton
              label={t.booking.increase(product.name)}
              disabled={quantity >= MAX_PRODUCT_QUANTITY}
              onClick={() => onChange(quantity + 1)}
              primary
            >
              <Plus aria-hidden className="size-4" />
            </StepButton>
          </div>
        </div>
      </div>
    </li>
  );
}

function StepButton({
  label,
  primary = false,
  ...props
}: { label: string; primary?: boolean } & Omit<ComponentProps<"button">, "type" | "aria-label">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${
        primary ? "bg-primary text-black hover:bg-primary/85" : "border border-line-strong text-fg hover:bg-surface-3"
      }`}
      {...props}
    />
  );
}
