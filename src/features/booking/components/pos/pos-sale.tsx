"use client";

import { Armchair, Banknote, ChevronDown, Coins, Minus, Plus, Popcorn, RotateCcw, TicketPercent, Trash2, UserRound, X } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { controlClasses } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { cinemaBookingApi, productApi } from "@/features/booking/api";
import { MAX_PRODUCT_QUANTITY } from "@/features/booking/components/food-step";
import { PosCashDialog } from "@/features/booking/components/pos/pos-cash-dialog";
import { PRODUCT_CATEGORIES, type Booking, type Product, type ProductCategory } from "@/features/booking/types";
import { loyaltyApi } from "@/features/loyalty/api";
import { formatPoints, maxPointsFor, POINT_VALUE } from "@/features/loyalty/rules";
import { discountOf } from "@/features/promotion/discount";
import { isVoucherError, voucherErrorMessage } from "@/features/promotion/errors";
import type { VoucherQuote } from "@/features/promotion/types";
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
 * right (with an optional voucher and the customer's loyalty points), then cash payment. Mount it with
 * `key={showtime.id}` so a new showtime starts a new order. The voucher is checked once (no use taken) and its discount
 * recomputed locally as the order changes; the sale checks it again. Points need the email of a customer account: its
 * balance is checked once, the number used is capped locally as the order changes, and the sale checks again.
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
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [quote, setQuote] = useState<VoucherQuote | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [pointsAccount, setPointsAccount] = useState<{ email: string; fullName: string; balance: number } | null>(null);
  const [pointsWanted, setPointsWanted] = useState("");
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [checkingPoints, setCheckingPoints] = useState(false);
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
    clearVoucher();
    clearPoints();
  }

  function clearPoints() {
    setPointsAccount(null);
    setPointsWanted("");
    setPointsError(null);
  }

  async function checkPoints() {
    const email = customer.email.trim().toLowerCase();
    setCheckingPoints(true);
    setPointsError(null);
    try {
      const found = await loyaltyApi.quote(cinemaId, { customerEmail: email, subtotal, voucherDiscount: discount });
      setPointsAccount({ email, fullName: found.fullName, balance: found.balance });
      setPointsWanted("");
    } catch (error) {
      setPointsAccount(null);
      setPointsError(errorCodeOf(error) === "LOYALTY_ACCOUNT_REQUIRED" ? t.loyalty.walkIn : getErrorMessage(error, t));
    } finally {
      setCheckingPoints(false);
    }
  }

  function clearVoucher() {
    setQuote(null);
    setVoucherCode("");
    setVoucherError(null);
    setVoucherOpen(false);
  }

  async function checkVoucher(event: FormEvent) {
    event.preventDefault();
    const code = voucherCode.trim();
    if (!code) return;
    const email = customer.email.trim();
    setCheckingVoucher(true);
    setVoucherError(null);
    try {
      setQuote(
        await cinemaBookingApi.quoteVoucher(cinemaId, {
          showtimeId: showtime.id,
          code,
          subtotal,
          customerEmail: EMAIL_PATTERN.test(email) ? email : undefined,
        }),
      );
      setVoucherCode("");
    } catch (error) {
      setVoucherError(voucherErrorMessage(error, t, intlLocale));
    } finally {
      setCheckingVoucher(false);
    }
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
          voucherCode: quote?.voucher.code,
          pointsToUse: pointsToUse || undefined,
        },
        idempotencyKey.current,
      );
      onSold(booking, received);
    } catch (error) {
      setCash((c) => ({ ...c, open: false }));
      const code = errorCodeOf(error);
      if (code?.startsWith("LOYALTY_")) {
        // E.g. the customer spent the points online since the check: check again
        toast.error(getErrorMessage(error, t));
        clearPoints();
      } else if (isVoucherError(error)) {
        // E.g. its last use went to another order since the check: sell without it or with another code
        toast.error(voucherErrorMessage(error, t, intlLocale));
        clearVoucher();
      } else if (code === "SEAT_NOT_AVAILABLE" && error instanceof ApiError && Array.isArray(error.details)) {
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
  const subtotal = seatTotal + foodTotal;
  const quoteDiscount = quote
    ? discountOf(
        {
          discountType: quote.voucher.discountType,
          discountValue: quote.voucher.discountValue,
          maxDiscount: quote.maxDiscount,
          minOrderValue: quote.minOrderValue,
        },
        subtotal,
      )
    : null;
  const belowMinimum = quote !== null && quoteDiscount === null;
  const discount = quoteDiscount ?? 0;
  // The checked balance belongs to the email it was checked for
  const linked = pointsAccount !== null && pointsAccount.email === customer.email.trim().toLowerCase() ? pointsAccount : null;
  const pointsMax = linked ? Math.min(linked.balance, maxPointsFor(subtotal, discount)) : 0;
  const pointsToUse = Math.min(Math.max(0, Math.floor(Number(pointsWanted) || 0)), pointsMax);
  const pointsDiscount = pointsToUse * POINT_VALUE;
  const total = subtotal - discount - pointsDiscount;
  const canCheckPoints = EMAIL_PATTERN.test(customer.email.trim());
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

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {quote ? (
            <div
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                belowMinimum ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10"
              }`}
            >
              <TicketPercent aria-hidden className={`size-5 shrink-0 ${belowMinimum ? "text-warning" : "text-success"}`} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">{quote.voucher.code}</p>
                <p className={`text-xs font-medium ${belowMinimum ? "text-warning" : "truncate text-fg-muted"}`} role={belowMinimum ? "alert" : undefined}>
                  {belowMinimum ? t.promotion.belowMinimum(formatVnd(quote.minOrderValue, intlLocale)) : quote.voucher.name}
                </p>
              </div>
              {!belowMinimum && <span className="shrink-0 font-bold text-success tabular-nums">−{formatVnd(discount, intlLocale)}</span>}
              <QtyButton label={t.promotion.removeCode(quote.voucher.code)} onClick={clearVoucher} disabled={selling}>
                <X aria-hidden className="size-4" />
              </QtyButton>
            </div>
          ) : voucherOpen ? (
            <>
              <form onSubmit={checkVoucher} className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => {
                    setVoucherCode(event.target.value.toUpperCase());
                    setVoucherError(null);
                  }}
                  placeholder={t.promotion.codePlaceholder}
                  aria-label={t.promotion.voucher}
                  aria-invalid={voucherError !== null || undefined}
                  aria-describedby={voucherError ? "pos-voucher-error" : undefined}
                  maxLength={30}
                  autoComplete="off"
                  autoFocus
                  className={`${controlClasses({ invalid: voucherError !== null })} min-w-0 flex-1 font-mono uppercase`}
                />
                <Button type="submit" className="shrink-0" loading={checkingVoucher} disabled={!voucherCode.trim() || selling}>
                  {t.promotion.apply}
                </Button>
                <QtyButton label={t.common.cancel} onClick={clearVoucher}>
                  <X aria-hidden className="size-4" />
                </QtyButton>
              </form>
              {voucherError && (
                <p id="pos-voucher-error" role="alert" className="text-xs font-semibold text-danger">
                  {voucherError}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setVoucherOpen(true)}
              disabled={selling}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-sm font-bold text-fg-2 transition-colors hover:border-accent hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TicketPercent aria-hidden className="size-5" />
              {t.promotion.addVoucher}
            </button>
          )}
        </div>

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

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg-2">
            <Coins aria-hidden className="size-4" />
            {t.loyalty.usePoints}
          </p>
          {linked ? (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {t.loyalty.customerPoints(linked.fullName, formatPoints(linked.balance, intlLocale))}
                </p>
                <QtyButton label={t.loyalty.remove} onClick={clearPoints} disabled={selling}>
                  <X aria-hidden className="size-4" />
                </QtyButton>
              </div>
              {pointsMax > 0 ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={pointsMax}
                      step={1}
                      value={pointsWanted}
                      onChange={(event) => setPointsWanted(event.target.value)}
                      placeholder="0"
                      aria-label={t.loyalty.pointsInput}
                      disabled={selling}
                      className={`${controlClasses()} min-w-0 flex-1 tabular-nums`}
                    />
                    <Button variant="outline" className="shrink-0" disabled={selling} onClick={() => setPointsWanted(String(pointsMax))}>
                      {t.loyalty.useMax}
                    </Button>
                  </div>
                  <p className="text-xs font-medium text-fg-muted">{t.loyalty.maxForOrder(formatPoints(pointsMax, intlLocale))}</p>
                </>
              ) : (
                <p className="text-xs font-medium text-fg-muted">{linked.balance === 0 ? t.loyalty.customerNoPoints : t.loyalty.notUsable}</p>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" disabled={!canCheckPoints || chosen.length === 0 || selling} loading={checkingPoints} onClick={checkPoints}>
                {t.loyalty.check}
              </Button>
              {pointsError ? (
                <p role="alert" className="text-xs font-semibold text-danger">
                  {pointsError}
                </p>
              ) : (
                !canCheckPoints && <p className="text-xs font-medium text-fg-muted">{t.loyalty.needEmail}</p>
              )}
            </>
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
          {discount > 0 && quote && (
            <div className="flex justify-between text-success">
              <dt>{t.promotion.discountLine(quote.voucher.code)}</dt>
              <dd className="tabular-nums">−{formatVnd(discount, intlLocale)}</dd>
            </div>
          )}
          {pointsToUse > 0 && (
            <div className="flex justify-between text-success">
              <dt>{t.loyalty.usedLine(formatPoints(pointsToUse, intlLocale))}</dt>
              <dd className="tabular-nums">−{formatVnd(pointsDiscount, intlLocale)}</dd>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between">
            <dt className="text-base">{t.booking.totalToPay}</dt>
            <dd className="text-3xl font-bold text-accent tabular-nums">{formatVnd(total, intlLocale)}</dd>
          </div>
        </dl>

        <Button size="lg" fullWidth className="h-16 text-lg" disabled={chosen.length === 0 || selling || belowMinimum} onClick={openCash}>
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
