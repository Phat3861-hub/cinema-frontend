"use client";

import { Pencil, Plus, Popcorn, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { adminChecks, anyError, backendFieldErrors, optional, type Errors } from "@/features/admin/form-utils";
import { productApi } from "@/features/booking/api";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "@/features/booking/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

/** Backend ProductRequest limits. */
const MAX_PRICE = 10_000_000;

/** Snack bar menu (PRODUCT_MANAGE): every product, on sale or not; delete is blocked once a booking used it. */
export function AdminProductsScreen() {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const products = useApi("products:all", productApi.listAll);
  const [category, setCategory] = useState<ProductCategory | "ALL">("ALL");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      products.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  }

  const all = products.data ?? [];
  const shown = category === "ALL" ? all : all.filter((product) => product.category === category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.products.subtitle}</p>
        <Button size="md" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" />
          {t.admin.products.add}
        </Button>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <Segmented
          label={t.admin.products.filter}
          value={category}
          onChange={setCategory}
          items={[
            { value: "ALL", label: t.admin.products.all, count: products.data ? all.length : undefined },
            ...PRODUCT_CATEGORIES.map((value) => ({
              value,
              label: t.booking.category[value],
              count: products.data ? all.filter((product) => product.category === value).length : undefined,
            })),
          ]}
        />
        {products.error && !products.data ? (
          <ErrorState error={products.error} onRetry={products.reload} />
        ) : products.data && shown.length === 0 ? (
          <EmptyState icon={Popcorn} title={t.admin.products.empty} />
        ) : (
          <Table className="min-w-[640px]">
            <thead>
              <tr>
                <Th>{t.admin.products.product}</Th>
                <Th>{t.admin.products.category}</Th>
                <Th className="text-right">{t.admin.products.price}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!products.data ? (
              <TableSkeleton columns={5} />
            ) : (
              <tbody>
                {shown.map((product) => (
                  <tr key={product.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                          <CoverImage src={product.imageUrl} alt={product.name} sizes="48px" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-fg">{product.name}</p>
                          {product.description && (
                            <p className="line-clamp-1 max-w-xs text-xs text-fg-muted">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>{t.booking.category[product.category]}</Td>
                    <Td className="text-right font-semibold text-fg">{formatVnd(product.price, intlLocale)}</Td>
                    <Td>
                      <Badge tone={product.active ? "success" : "neutral"}>
                        {product.active ? t.admin.products.onSale : t.admin.products.offSale}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={t.common.editItem(product.name)} onClick={() => setEditing(product)}>
                          <Pencil aria-hidden className="size-4" />
                        </IconButton>
                        <IconButton label={t.common.deleteItem(product.name)} tone="danger" onClick={() => setToDelete(product)}>
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
      </Card>

      {editing !== null && (
        <ProductDialog
          product={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            products.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t.admin.products.deleteTitle}
        description={toDelete ? t.admin.products.deleteText(toDelete.name) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

type Field = "name" | "category" | "description" | "imageUrl" | "price";

function ProductDialog({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const check = adminChecks(t);
  const [values, setValues] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "COMBO",
    description: product?.description ?? "",
    imageUrl: product?.imageUrl ?? "",
    price: product ? String(Number(product.price)) : "",
  });
  const [active, setActive] = useState(product?.active ?? true);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: Field) => (event: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: Errors<Field> = {
      name: check.required(values.name) ?? check.maxLength(values.name, 150),
      description: check.maxLength(values.description, 1000),
      imageUrl: check.url(values.imageUrl) ?? check.maxLength(values.imageUrl, 500),
      price: check.intRange(values.price, 0, MAX_PRICE),
    };
    setErrors(found);
    if (anyError(found)) return;
    setSaving(true);
    setFormError(null);
    const body = {
      name: values.name.trim(),
      category: values.category as ProductCategory,
      description: optional(values.description),
      imageUrl: optional(values.imageUrl),
      price: Number(values.price),
      active,
    };
    try {
      if (product) await productApi.update(product.id, body);
      else await productApi.create(body);
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (error) {
      const fieldErrors = backendFieldErrors<Field>(error, t);
      if (anyError(fieldErrors)) setErrors(fieldErrors);
      else setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={product ? t.admin.products.edit : t.admin.products.add}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="product-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="product-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">{getErrorMessage(formError, t)}</Alert>
          </div>
        )}
        <div className="sm:col-span-2">
          <TextField label={t.admin.products.name} required autoFocus value={values.name} onChange={set("name")} error={errors.name} />
        </div>
        <SelectField label={t.admin.products.category} required value={values.category} onChange={set("category")}>
          {PRODUCT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t.booking.category[value]}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t.admin.products.price}
          required
          inputMode="numeric"
          value={values.price}
          onChange={set("price")}
          error={errors.price}
        />
        <div className="sm:col-span-2">
          <TextField
            label={t.admin.products.imageUrl}
            optional
            type="url"
            value={values.imageUrl}
            onChange={set("imageUrl")}
            error={errors.imageUrl}
          />
        </div>
        <div className="sm:col-span-2">
          <TextareaField
            label={t.admin.products.description}
            optional
            rows={3}
            value={values.description}
            onChange={set("description")}
            error={errors.description}
          />
        </div>
        <Checkbox
          className="sm:col-span-2"
          label={t.admin.products.onSale}
          description={t.admin.products.activeHint}
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
      </form>
    </Dialog>
  );
}
