"use client";

import { Armchair, Banknote, ChevronDown, Minus, Plus, Popcorn, RotateCcw, Trash2, UserRound, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { TextField } from "@/components/ui/text-field";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { cinemaBookingApi, productApi } from "@/features/booking/api";
import { MAX_PRODUCT_QUANTITY } from "@/features/booking/components/food-step";
import { PosCashDialog } from "@/features/booking/components/pos/pos-cash-dialog";
import { PRODUCT_CATEGORIES, type Booking, type Product, type ProductCategory } from "@/features/booking/types";
import { showtimeApi } from "@/features/showtime/api";
import { SeatLegend, SeatMap, type SeatVisual } from "@/features/showtime/components/seat-map";
import { useSeatUpdates } from "@/features/showtime/hooks/use-seat-updates";
import type { Showtime, ShowtimeSeat, ShowtimeSeatStatus } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { errorCodeOf, getErrorMessage } from "@/lib/error-messages";
import { formatDateTime, formatVnd } from "@/lib/format";

/** Backend `app.booking.max-seats-per-booking`. */
const MAX_SEATS = 8;
/** Same rules as the backend DTO (ValidationPatterns). */
const PHONE_PATTERN = /^(0|\+84)[35789]\d{8}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Tab = "seats" | "food";
type Seat = ShowtimeSeat & { id: number };
interface Customer {
  name: string;
  phone: string;
  email: string;
}

/**
 * POS steps 2–3 for one showtime: touch seat map (live over STOMP) and snack tiles on the left, the order on the
 * right, then cash payment. Mount it with `key={showtime.id}` so a new showtime starts a new order.
 */
export function PosSale({
  cinemaId,
  showtime,
  onChangeShowtime,
  onSold,
}: {
  cinemaId: number;
  showtime: Showtime;
  onChangeShowtime: () => void;
  onSold: (booking: Booking, received: number) => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const seatMap = useApi(`pos-seats:${showtime.id}`, () => showtimeApi.seats(showtime.id));
  const products = useApi("products:on-sale", () => productApi.listOnSale());

  const [tab, setTab] = useState<Tab>("seats");
  const [category, setCategory] = useState<ProductCategory | "ALL">("ALL");
  const [selected, setSelectedState] = useState<Set<number>>(new Set());
  // Read by seat broadcasts, which can arrive back to back (HELD then BOOKED) before the next render.
  const selectedRef = useRef(selected);
  function setSelected(next: Set<number>) {
    selectedRef.current = next;
    setSelectedState(next);
  }
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [limitHit, setLimitHit] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" });
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [cash, setCash] = useState<{ open: boolean; key: number }>({ open: false, key: 0 });
  const [selling, setSelling] = useState(false);
  const idempotencyKey = useRef("");
  // Our own sale is broadcast too (HELD then BOOKED); ignore it while the request is in flight.
  const sellingRef = useRef(false);

  const seats: Seat[] = (seatMap.data?.seats ?? []).map((seat) => ({ ...seat, id: seat.seatId }));
  const byId = new Map(seats.map((seat) => [seat.id, seat]));

  function setSeatStatus(seatIds: number[], status: ShowtimeSeatStatus) {
    seatMap.setData(
      (map) => map && { ...map, seats: map.seats.map((seat) => (seatIds.includes(seat.seatId) ? { ...seat, status } : seat)) },
    );
  }

  /** Removes seats someone else just took (with their couple partners) from the order. */
  function dropSeats(seatIds: number[]) {
    const current = selectedRef.current;
    const taken = seatIds.filter((id) => current.has(id));
    if (taken.length === 0) return;
    const next = new Set(current);
    for (const id of taken) {
      next.delete(id);
      const partner = byId.get(id)?.pairedSeatId;
      if (partner != null) next.delete(partner);
    }
    setSelected(next);
    toast.error(t.booking.seatsTaken(taken.map((id) => byId.get(id)?.seatCode ?? "").join(", ")));
  }

  useSeatUpdates(
    showtime.id,
    (change) => {
      setSeatStatus(change.seatIds, change.status);
      if (!sellingRef.current && change.status !== "AVAILABLE") dropSeats(change.seatIds);
    },
    seatMap.reload,
  );

  function toggle(seat: Seat) {
    const group = seat.pairedSeatId !== null ? [seat.id, seat.pairedSeatId] : [seat.id];
    const next = new Set(selected);
    if (group.every((id) => next.has(id))) group.forEach((id) => next.delete(id));
    else if (next.size + group.length > MAX_SEATS) return setLimitHit(true);
    else group.forEach((id) => next.add(id));
    setLimitHit(false);
    setSelected(next);
  }

  function visual(seat: Seat): SeatVisual {
    if (selected.has(seat.id)) return "selected";
    if (seat.status === "BLOCKED") return "blocked";
    if (seat.status !== "AVAILABLE") return "taken";
    return "available";
  }

  function setQuantity(productId: number, quantity: number) {
    setQuantities((q) => ({ ...q, [productId]: Math.max(0, Math.min(MAX_PRODUCT_QUANTITY, quantity)) }));
  }

  function resetOrder() {
    setSelected(new Set());
    setQuantities({});
    setCustomer({ name: "", phone: "", email: "" });
    setCustomerErrors({});
    setLimitHit(false);
  }

  function validateCustomer(): boolean {
    const errors: Partial<Record<keyof Customer, string>> = {};
    if (customer.phone.trim() && !PHONE_PATTERN.test(customer.phone.trim())) errors.phone = t.validation.phoneInvalid;
    if (customer.email.trim() && !EMAIL_PATTERN.test(customer.email.trim())) errors.email = t.validation.emailInvalid;
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) setCustomerOpen(true);
    return Object.keys(errors).length === 0;
  }

  function openCash() {
    if (!validateCustomer()) return;
    // One key per payment attempt: a double click or a retry after a timeout returns the same booking.
    idempotencyKey.current = crypto.randomUUID();
    setCash((c) => ({ open: true, key: c.key + 1 }));
  }

  async function sell(received: number) {
    sellingRef.current = true;
    setSelling(true);
    try {
      const booking = await cinemaBookingApi.sell(
        cinemaId,
        {
          showtimeId: showtime.id,
          seatIds: [...selected],
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          customerName: customer.name.trim() || undefined,
          customerPhone: customer.phone.trim() || undefined,
          customerEmail: customer.email.trim() || undefined,
        },
        idempotencyKey.current,
      );
      onSold(booking, received);
    } catch (error) {
      setCash((c) => ({ ...c, open: false }));
      const code = errorCodeOf(error);
      if (code === "SEAT_NOT_AVAILABLE" && error instanceof ApiError && Array.isArray(error.details)) {
        const taken = error.details as number[];
        setSeatStatus(taken, "HELD");
        dropSeats(taken);
        setTab("seats");
      } else {
        toast.error(getErrorMessage(error, t));
        if (code === "PRODUCT_NOT_ON_SALE") products.reload();
        if (code === "SHOWTIME_NOT_ON_SALE") onChangeShowtime();
      }
    } finally {
      sellingRef.current = false;
      setSelling(false);
    }
  }

  const chosen = [...selected].map((id) => byId.get(id)).filter((seat): seat is Seat => !!seat);
  chosen.sort((a, b) => a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true }));
  const lines = (products.data ?? [])
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({ product, quantity: quantities[product.id] }));
  const seatTotal = chosen.reduce((sum, seat) => sum + Number(seat.price), 0);
  const foodTotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const total = seatTotal + foodTotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const visibleProducts = (products.data ?? []).filter((p) => category === "ALL" || p.category === category);
  const categories = PRODUCT_CATEGORIES.filter((c) => (products.data ?? []).some((p) => p.category === c));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="pos-sale-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pos-sale-title" className="text-xl font-bold break-words">
              {showtime.movie.title}
            </h2>
            <p className="text-sm font-semibold text-fg-muted">
              {formatDateTime(showtime.startTime, intlLocale)} · {showtime.room.name} · {showtime.format} ·{" "}
              {t.showtime.audio[showtime.audioType]}
            </p>
          </div>
          <Button variant="outline" size="md" onClick={onChangeShowtime} disabled={selling}>
            <RotateCcw aria-hidden className="size-4" />
            {t.admin.pos.changeShowtime}
          </Button>
        </div>

        <div role="group" aria-label={t.admin.pos.sections} className="grid grid-cols-2 gap-2">
          <TabButton active={tab === "seats"} onClick={() => setTab("seats")} icon={Armchair} label={t.booking.seats} count={chosen.length} />
          <TabButton active={tab === "food"} onClick={() => setTab("food")} icon={Popcorn} label={t.booking.snacks} count={itemCount} />
        </div>

        {tab === "seats" &&
          (seatMap.error && !seatMap.data ? (
            <ErrorState error={seatMap.error} onRetry={seatMap.reload} />
          ) : !seatMap.data ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <div className="flex flex-col gap-4">
              <SeatMap
                size="lg"
                totalRows={seatMap.data.totalRows}
                totalColumns={seatMap.data.totalColumns}
                seats={seats}
                seatTypes={seatMap.data.seatTypes}
                visual={visual}
                onSeat={selling ? undefined : toggle}
                isInteractive={(seat) => seat.status === "AVAILABLE"}
                seatLabel={(seat) =>
                  t.seat.seatAria(seat.seatCode, t.seat.type[seat.seatType], formatVnd(seat.price, intlLocale), t.seat.status[seat.status])
                }
              />
              <SeatLegend
                seatTypes={seatMap.data.seatTypes}
                states={["available", "selected", "taken", "blocked"]}
                surcharge={(amount) => formatVnd(amount, intlLocale)}
              />
              {limitHit && (
                <p role="alert" className="text-sm font-semibold text-danger">
                  {t.booking.maxSeats(MAX_SEATS)}
                </p>
              )}
            </div>
          ))}

        {tab === "food" &&
          (products.error && !products.data ? (
            <ErrorState error={products.error} onRetry={products.reload} />
          ) : !products.data ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="flex flex-col gap-4">
              <div role="group" aria-label={t.admin.products.filter} className="flex gap-2 overflow-x-auto pb-1">
                {(["ALL", ...categories] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                    className={
                      "h-11 shrink-0 cursor-pointer rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent " +
                      (category === value ? "bg-primary text-black" : "bg-surface-2 text-fg-2 hover:bg-surface-3")
                    }
                  >
                    {value === "ALL" ? t.admin.products.all : t.booking.category[value]}
                  </button>
                ))}
              </div>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                {visibleProducts.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    quantity={quantities[product.id] ?? 0}
                    onChange={(quantity) => setQuantity(product.id, quantity)}
                    disabled={selling}
                  />
                ))}
              </ul>
            </div>
          ))}
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:sticky lg:top-4" aria-labelledby="pos-order-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="pos-order-title" className="text-h8">
            {t.admin.pos.order}
          </h2>
          {(chosen.length > 0 || itemCount > 0) && (
            <Button variant="ghost" size="sm" onClick={resetOrder} disabled={selling}>
              <Trash2 aria-hidden className="size-4" />
              {t.admin.pos.clearOrder}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-wide text-fg-muted uppercase">{t.booking.selectedSeats(chosen.length, MAX_SEATS)}</p>
          {chosen.length === 0 ? (
            <p className="text-sm font-medium text-fg-subtle">{t.admin.pos.noSeats}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {chosen
                .filter((seat) => seat.pairedSeatId === null || !selected.has(seat.pairedSeatId) || seat.id < seat.pairedSeatId)
                .map((seat) => {
                  const pair = seat.pairedSeatId !== null ? byId.get(seat.pairedSeatId) : undefined;
                  const label = pair ? `${seat.seatCode}-${pair.seatCode}` : seat.seatCode;
                  return (
                    <li key={seat.id}>
                      <button
                        type="button"
                        onClick={() => toggle(seat)}
                        disabled={selling}
                        aria-label={t.admin.pos.removeSeat(label)}
                        className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-bold text-black transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {label}
                        <X aria-hidden className="size-4" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <ul className="flex flex-col gap-2 border-t border-line pt-3">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 font-semibold break-words">{product.name}</span>
                <QtyButton label={t.booking.decrease(product.name)} onClick={() => setQuantity(product.id, quantity - 1)} disabled={selling}>
                  <Minus aria-hidden className="size-4" />
                </QtyButton>
                <output className="w-6 text-center font-bold tabular-nums">{quantity}</output>
                <QtyButton
                  label={t.booking.increase(product.name)}
                  onClick={() => setQuantity(product.id, quantity + 1)}
                  disabled={selling || quantity >= MAX_PRODUCT_QUANTITY}
                >
                  <Plus aria-hidden className="size-4" />
                </QtyButton>
                <span className="w-24 text-right font-semibold tabular-nums">{formatVnd(Number(product.price) * quantity, intlLocale)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <button
            type="button"
            aria-expanded={customerOpen}
            onClick={() => setCustomerOpen((open) => !open)}
            className="flex cursor-pointer items-center justify-between gap-2 rounded text-sm font-semibold text-fg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="flex items-center gap-2">
              <UserRound aria-hidden className="size-4" />
              {t.admin.pos.customer}
            </span>
            <ChevronDown aria-hidden className={`size-4 transition-transform ${customerOpen ? "rotate-180" : ""}`} />
          </button>
          {customerOpen && (
            <div className="flex flex-col gap-3">
              <TextField
                label={t.admin.pos.customerName}
                value={customer.name}
                maxLength={100}
                onChange={(event) => setCustomer((c) => ({ ...c, name: event.target.value }))}
              />
              <TextField
                label={t.admin.pos.customerPhone}
                value={customer.phone}
                inputMode="tel"
                error={customerErrors.phone}
                onChange={(event) => setCustomer((c) => ({ ...c, phone: event.target.value }))}
              />
              <TextField
                label={t.admin.pos.customerEmail}
                type="email"
                value={customer.email}
                maxLength={255}
                error={customerErrors.email}
                hint={t.admin.pos.customerEmailHint}
                onChange={(event) => setCustomer((c) => ({ ...c, email: event.target.value }))}
              />
            </div>
          )}
        </div>

        <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm font-semibold">
          <div className="flex justify-between text-fg-muted">
            <dt>{t.booking.seats}</dt>
            <dd className="tabular-nums">{formatVnd(seatTotal, intlLocale)}</dd>
          </div>
          <div className="flex justify-between text-fg-muted">
            <dt>{t.booking.snacks}</dt>
            <dd className="tabular-nums">{formatVnd(foodTotal, intlLocale)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <dt className="text-base">{t.booking.totalToPay}</dt>
            <dd className="text-3xl font-bold text-accent tabular-nums">{formatVnd(total, intlLocale)}</dd>
          </div>
        </dl>

        <Button size="lg" fullWidth className="h-16 text-lg" disabled={chosen.length === 0 || selling} onClick={openCash}>
          <Banknote aria-hidden className="size-6" />
          {t.admin.pos.collectCash}
        </Button>
      </aside>

      <PosCashDialog
        key={cash.key}
        open={cash.open}
        total={total}
        loading={selling}
        onClose={() => setCash((c) => ({ ...c, open: false }))}
        onConfirm={sell}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Armchair;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        "flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        (active ? "bg-primary text-black" : "bg-surface-2 text-fg-2 hover:bg-surface-3")
      }
    >
      <Icon aria-hidden className="size-5" />
      {label}
      {count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-black/15" : "bg-primary text-black"}`}>{count}</span>
      )}
    </button>
  );
}

/** Snack tile: tap to add one; the minus button appears once the product is in the order. */
function ProductTile({
  product,
  quantity,
  onChange,
  disabled,
}: {
  product: Product;
  quantity: number;
  onChange: (quantity: number) => void;
  disabled: boolean;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  return (
    <li className="relative">
      <button
        type="button"
        disabled={disabled || quantity >= MAX_PRODUCT_QUANTITY}
        onClick={() => onChange(quantity + 1)}
        aria-label={t.booking.increase(product.name)}
        className={
          "flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 text-left transition-colors " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:cursor-not-allowed " +
          (quantity > 0 ? "border-primary bg-primary/10" : "border-line bg-surface-2 hover:border-line-strong")
        }
      >
        <span className="relative aspect-[4/3] w-full bg-surface-3">
          <CoverImage src={product.imageUrl} alt="" sizes="200px" />
        </span>
        <span className="flex flex-col gap-0.5 p-3">
          <span className="line-clamp-2 text-sm font-bold">{product.name}</span>
          <span className="text-sm font-bold text-accent">{formatVnd(product.price, intlLocale)}</span>
        </span>
      </button>
      {quantity > 0 && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-black shadow"
          >
            {quantity}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(quantity - 1)}
            aria-label={t.booking.decrease(product.name)}
            className="absolute top-2 left-2 flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Minus aria-hidden className="size-4" />
          </button>
        </>
      )}
    </li>
  );
}

function QtyButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
