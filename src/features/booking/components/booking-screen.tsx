"use client";

import { Check, Info } from "lucide-react";
import Link from "next/link";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ROUTES, withQuery } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { bookingApi, productApi } from "@/features/booking/api";
import { BookingSummary, type SummaryItem } from "@/features/booking/components/booking-summary";
import { FoodStep } from "@/features/booking/components/food-step";
import { HoldCountdown } from "@/features/booking/components/hold-countdown";
import { PaymentStep } from "@/features/booking/components/payment-step";
import type { Booking, BookingItemInput, Product } from "@/features/booking/types";
import { showtimeApi } from "@/features/showtime/api";
import { SeatLegend, SeatMap, type SeatVisual } from "@/features/showtime/components/seat-map";
import { useSeatUpdates, type SeatStatusChange } from "@/features/showtime/hooks/use-seat-updates";
import type { Showtime, ShowtimeSeat, ShowtimeSeatMap, ShowtimeSeatStatus } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { errorCodeOf, getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

/** Backend `app.booking.max-seats-per-booking`. */
const MAX_SEATS = 8;
const STEPS = ["seats", "food", "payment", "ticket"] as const;
type Step = (typeof STEPS)[number];
type Seat = ShowtimeSeat & { id: number };

/**
 * Online booking flow (docs/ui-design.md §4.3): seats → snacks → payment → ticket. "Continue" on the seat step
 * holds the seats (PENDING booking with a countdown); the seat map follows other buyers live over STOMP.
 */
export function BookingScreen({ showtimeId }: { showtimeId: string }) {
  const showtime = useApi(`showtime:${showtimeId}`, () => showtimeApi.get(showtimeId));
  const seatMap = useApi(`seats:${showtimeId}`, () => showtimeApi.seats(showtimeId));
  // The snack step is skipped when the menu is empty or cannot be loaded.
  const products = useApi("products:on-sale", () => productApi.listOnSale());

  const error = showtime.error ?? seatMap.error;
  if (error instanceof ApiError && error.code === "SHOWTIME_NOT_FOUND") notFound();
  if (error && !(showtime.data && seatMap.data)) {
    return <ErrorState error={error} onRetry={() => (showtime.reload(), seatMap.reload())} />;
  }
  if (!showtime.data || !seatMap.data) {
    return (
      <div className="mx-auto grid w-full max-w-[1232px] gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[480px] rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }

  return (
    <BookingFlow
      showtime={showtime.data}
      seatMap={seatMap.data}
      products={products.data ?? []}
      reloadSeats={seatMap.reload}
      setSeatStatus={(seatIds, status) =>
        seatMap.setData(
          (map) =>
            map && {
              ...map,
              seats: map.seats.map((seat) => (seatIds.includes(seat.seatId) ? { ...seat, status } : seat)),
            },
        )
      }
    />
  );
}

function BookingFlow({
  showtime,
  seatMap,
  products,
  reloadSeats,
  setSeatStatus,
}: {
  showtime: Showtime;
  seatMap: ShowtimeSeatMap;
  products: Product[];
  reloadSeats: () => void;
  setSeatStatus: (seatIds: number[], status: ShowtimeSeatStatus) => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();

  const [step, setStep] = useState<Step>("seats");
  const [selected, setSelectedState] = useState<Set<number>>(new Set());
  // Read by seat broadcasts, which can arrive back to back (HELD then BOOKED) before the next render.
  const selectedRef = useRef(selected);
  function setSelected(next: Set<number>) {
    selectedRef.current = next;
    setSelectedState(next);
  }
  const [limitHit, setLimitHit] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  /** Local clock time the hold ends (server hold length, so a skewed browser clock doesn't matter). */
  const [deadline, setDeadline] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<"hold" | "items" | "back" | "cancel" | null>(null);
  const [expired, setExpired] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Our own hold is broadcast too; ignore it while the request is in flight.
  const holding = useRef(false);

  const seats: Seat[] = seatMap.seats.map((seat) => ({ ...seat, id: seat.seatId }));
  const byId = new Map(seats.map((seat) => [seat.id, seat]));
  const onSale = seatMap.showtimeStatus === "OPEN" && new Date(showtime.startTime) > new Date();
  const hasFood = products.length > 0;

  /** Removes seats someone else just took (and their couple partners) from the selection, with a toast. */
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
    const codes = taken.map((id) => byId.get(id)?.seatCode ?? "").filter(Boolean);
    toast.error(t.booking.seatsTaken(codes.join(", ")));
  }

  useSeatUpdates(
    showtime.id,
    (change: SeatStatusChange) => {
      setSeatStatus(change.seatIds, change.status);
      if (step !== "seats" || holding.current || change.status === "AVAILABLE") return;
      dropSeats(change.seatIds);
    },
    reloadSeats,
  );

  function toggle(seat: Seat) {
    // A couple seat is always booked as a pair.
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

  function clearHold() {
    setBooking(null);
    setDeadline(null);
    setQuantities({});
    setStep("seats");
    reloadSeats();
  }

  /** The hold ended or was closed by the server: tell the user, keep the selection for a new try. */
  function failOnBooking(error: unknown) {
    const code = errorCodeOf(error);
    if (code === "BOOKING_EXPIRED" || code === "BOOKING_NOT_PENDING" || code === "BOOKING_NOT_FOUND") setExpired(true);
    else toast.error(getErrorMessage(error, t));
  }

  async function hold() {
    if (sessionStatus === "anonymous") {
      router.push(withQuery(ROUTES.login, { next: pathname }));
      return;
    }
    holding.current = true;
    setBusy("hold");
    try {
      const held = await bookingApi.hold({ showtimeId: showtime.id, seatIds: [...selected] }, crypto.randomUUID());
      const holdMs = held.expiresAt ? Date.parse(held.expiresAt) - Date.parse(held.createdAt) : 0;
      setBooking(held);
      setDeadline(Date.now() + holdMs);
      setQuantities(Object.fromEntries(held.items.map((item) => [item.productId, item.quantity])));
      setStep(hasFood ? "food" : "payment");
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === "UNAUTHORIZED") {
        router.push(withQuery(ROUTES.login, { next: pathname }));
      } else if (code === "SEAT_NOT_AVAILABLE" && error instanceof ApiError && Array.isArray(error.details)) {
        const taken = error.details as number[];
        setSeatStatus(taken, "HELD");
        dropSeats(taken);
      } else {
        toast.error(getErrorMessage(error, t));
        if (code === "SHOWTIME_NOT_ON_SALE" || code === "SEAT_NOT_AVAILABLE") reloadSeats();
      }
    } finally {
      holding.current = false;
      setBusy(null);
    }
  }

  async function saveFood(skip: boolean) {
    if (!booking) return;
    const items: BookingItemInput[] = skip
      ? []
      : Object.entries(quantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([productId, quantity]) => ({ productId: Number(productId), quantity }));
    const unchanged =
      items.length === booking.items.length &&
      items.every((item) => booking.items.some((b) => b.productId === item.productId && b.quantity === item.quantity));
    if (skip) setQuantities({});
    if (unchanged) return setStep("payment");
    setBusy("items");
    try {
      setBooking(await bookingApi.replaceItems(booking.id, items));
      setStep("payment");
    } catch (error) {
      failOnBooking(error);
    } finally {
      setBusy(null);
    }
  }

  /** Back to the seat map: the hold is released so the seats can be changed. */
  async function releaseHold(action: "back" | "cancel") {
    if (!booking) return;
    setBusy(action);
    try {
      await bookingApi.cancel(booking.id);
    } catch (error) {
      const code = errorCodeOf(error);
      if (code !== "BOOKING_EXPIRED" && code !== "BOOKING_NOT_PENDING") {
        toast.error(getErrorMessage(error, t));
        setBusy(null);
        return;
      }
    }
    if (action === "cancel") {
      setSelected(new Set());
      toast.success(t.booking.cancelled);
    }
    setConfirmCancel(false);
    setBusy(null);
    clearHold();
  }

  const chosen = [...selected].map((id) => byId.get(id)).filter((seat): seat is Seat => !!seat);
  chosen.sort((a, b) => a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true }));
  const seatTotal = chosen.reduce((sum, seat) => sum + Number(seat.price), 0);

  const foodPreview: SummaryItem[] = products
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      quantity: quantities[product.id],
      totalPrice: Number(product.price) * quantities[product.id],
    }));

  const summarySeats = booking ? booking.seats : chosen;
  const summaryItems = step === "food" ? foodPreview : (booking?.items ?? []);
  const total =
    step === "seats"
      ? seatTotal
      : step === "food" && booking
        ? booking.seats.reduce((sum, seat) => sum + Number(seat.price), 0) +
          foodPreview.reduce((sum, item) => sum + item.totalPrice, 0)
        : Number(booking?.totalAmount ?? 0);
  const busyAny = busy !== null;

  return (
    <div className="mx-auto flex w-full max-w-[1232px] flex-col gap-6 px-4 py-6">
      <Steps current={step} skipFood={!hasFood} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {step === "seats" && (
          <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <h1 className="sr-only">{t.booking.seatTitle}</h1>
            {!onSale && <Alert tone="warning">{t.booking.notOnSale}</Alert>}
            <SeatMap
              totalRows={seatMap.totalRows}
              totalColumns={seatMap.totalColumns}
              seats={seats}
              seatTypes={seatMap.seatTypes}
              visual={visual}
              onSeat={onSale && !busyAny ? toggle : undefined}
              isInteractive={(seat) => seat.status === "AVAILABLE"}
              seatLabel={(seat) =>
                t.seat.seatAria(
                  seat.seatCode,
                  t.seat.type[seat.seatType],
                  formatVnd(seat.price, intlLocale),
                  t.seat.status[seat.status],
                )
              }
            />
            <SeatLegend
              seatTypes={seatMap.seatTypes}
              states={["available", "selected", "taken", "blocked"]}
              surcharge={(amount) => formatVnd(amount, intlLocale)}
            />
            <p className="flex items-center gap-2 text-xs font-medium text-fg-muted">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              {t.booking.liveSeats}
            </p>
          </div>
        )}
        {step === "food" && (
          <FoodStep
            products={products}
            quantities={quantities}
            onChange={(productId, quantity) => setQuantities((q) => ({ ...q, [productId]: quantity }))}
          />
        )}
        {step === "payment" && booking && <PaymentStep booking={booking} />}

        <BookingSummary
          showtime={showtime}
          seatsTitle={step === "seats" ? t.booking.selectedSeats(chosen.length, MAX_SEATS) : t.booking.seats}
          seats={summarySeats}
          emptySeats={t.booking.pickSeats}
          items={summaryItems}
          discount={step === "payment" ? Number(booking?.discountAmount ?? 0) : 0}
          total={total}
          top={deadline !== null && step !== "seats" && <HoldCountdown deadline={deadline} onExpire={() => setExpired(true)} />}
        >
          {step === "seats" && (
            <>
              {limitHit && (
                <p role="alert" className="-mt-2 text-xs font-semibold text-danger">
                  {t.booking.maxSeats(MAX_SEATS)}
                </p>
              )}
              <Button fullWidth disabled={!onSale || chosen.length === 0} loading={busy === "hold"} onClick={hold}>
                {t.booking.continue}
              </Button>
              <Link href={ROUTES.movieDetail(showtime.movie.slug)} className={buttonClasses({ variant: "ghost", size: "md" })}>
                {t.booking.otherShowtimes}
              </Link>
            </>
          )}
          {step === "food" && (
            <>
              <Button fullWidth loading={busy === "items"} disabled={busyAny} onClick={() => saveFood(false)}>
                {t.booking.continue}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="md" loading={busy === "back"} disabled={busyAny} onClick={() => releaseHold("back")}>
                  {t.booking.changeSeats}
                </Button>
                <Button variant="ghost" size="md" disabled={busyAny} onClick={() => saveFood(true)}>
                  {t.booking.skip}
                </Button>
              </div>
            </>
          )}
          {step === "payment" && (
            <>
              <Button fullWidth disabled>
                {t.booking.payNow}
              </Button>
              <p className="flex gap-2 text-xs font-medium text-fg-muted">
                <Info aria-hidden className="size-4 shrink-0" />
                {t.booking.comingSoon}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  disabled={busyAny}
                  loading={busy === "back"}
                  onClick={() => (hasFood ? setStep("food") : releaseHold("back"))}
                >
                  {hasFood ? t.booking.back : t.booking.changeSeats}
                </Button>
                <Button variant="ghost" size="md" disabled={busyAny} onClick={() => setConfirmCancel(true)}>
                  {t.booking.cancelBooking}
                </Button>
              </div>
            </>
          )}
        </BookingSummary>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => releaseHold("cancel")}
        loading={busy === "cancel"}
        title={t.booking.cancelTitle}
        description={t.booking.cancelText}
        confirmLabel={t.booking.cancelBooking}
      />
      <Dialog
        open={expired}
        onClose={() => {
          setExpired(false);
          clearHold();
        }}
        size="sm"
        title={t.booking.expiredTitle}
        description={t.booking.expiredText}
        footer={
          <Button
            size="md"
            onClick={() => {
              setExpired(false);
              clearHold();
            }}
          >
            {t.booking.chooseAgain}
          </Button>
        }
      />
    </div>
  );
}

function Steps({ current, skipFood }: { current: Step; skipFood: boolean }) {
  const t = useT();
  const labels: Record<Step, string> = {
    seats: t.booking.stepSeats,
    food: t.booking.stepFood,
    payment: t.booking.stepPayment,
    ticket: t.booking.stepTicket,
  };
  const steps = STEPS.filter((step) => !(skipFood && step === "food"));
  const currentIndex = steps.indexOf(current);
  return (
    <ol className="flex items-center gap-2 overflow-x-auto text-sm font-semibold" aria-label={t.booking.steps}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                active ? "bg-primary text-black" : done ? "bg-surface-2 text-fg" : "bg-surface-2 text-fg-muted"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full text-xs ${done ? "bg-success text-black" : "bg-black/10"}`}
              >
                {done ? <Check aria-hidden className="size-3" strokeWidth={3} /> : index + 1}
              </span>
              {labels[step]}
            </span>
            {index < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-line-strong" />}
          </li>
        );
      })}
    </ol>
  );
}
