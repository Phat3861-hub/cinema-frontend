/** Mirrors com.pnt.cinema.modules.promotion loyalty DTOs. Money is VND; instants are ISO UTC. */
export type LoyaltyTransactionType = "EARN" | "REDEEM" | "RELEASE" | "ADJUST";

/** Balance and the rules behind it: `earnStep` VND earn 1 point, 1 point = `pointValue` VND, at most `maxRedeemPercent` %. */
export interface LoyaltyBalance {
  balance: number;
  pointValue: number;
  earnStep: number;
  maxRedeemPercent: number;
}

/** One change to the balance; `points` is signed (negative = taken). */
export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  /** Booking changes only; `bookingCode` null when the booking is gone. */
  booking: { id: number; bookingCode: string | null } | null;
  /** Reason of an admin adjustment. */
  note: string | null;
  adjustedBy: { id: number; fullName: string } | null;
  createdAt: string;
}

export interface LoyaltyAdjustRequest {
  points: number;
  reason: string;
}

/** Counter check: the customer's balance and the most points this order allows (already capped by the balance). */
export interface LoyaltyQuote {
  userId: number;
  fullName: string;
  balance: number;
  maxPoints: number;
}

export interface CounterPointsQuoteRequest {
  customerEmail: string;
  subtotal: number;
  voucherDiscount?: number;
}
