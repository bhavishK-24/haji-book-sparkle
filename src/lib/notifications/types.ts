/**
 * Channel-agnostic notification contract.
 *
 * The booking engine emits *events* — facts about what happened. It has no
 * idea which channels exist, how they are worded, or whether delivery
 * succeeded. Adding WhatsApp later means registering one more channel
 * adapter; it must never mean editing the booking flow.
 *
 * Nothing in this file may import a provider SDK or mention a vendor.
 */

/** Every notifiable thing that can happen to a booking. */
export type NotificationEvent =
  | "booking_created"
  | "booking_confirmed"
  | "booking_status_changed"
  | "booking_cancelled"
  | "enquiry_received";

export type NotificationChannel = "whatsapp" | "email" | "sms" | "internal";

/** The same event is sent to both, worded differently by each adapter. */
export type NotificationAudience = "customer" | "staff";

/**
 * Data a channel adapter may use to build a message.
 *
 * Deliberately flat and primitive — an adapter should never need to reach
 * back into the database or the service catalogue to render a message.
 */
export type NotificationPayload = {
  reference: string;
  customerName: string;
  serviceName: string;
  serviceId: string | null;
  packageLabel: string | null;
  addOns: Array<{ id: string; name: string; quantity: number | null }>;
  propertySize: string | null;
  furnishing: string | null;
  date: string;
  requestedStart: string | null;
  /** Null until duration metrics exist; adapters must handle that. */
  estimatedMinutes: number | null;
  emirate: string | null;
  status: BookingStatus;
  /** AED. Null while pricing is unset — never render null as zero. */
  priceAmount: number | null;
  priceCurrency: string;
};

export type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";

export type NotificationRequest = {
  event: NotificationEvent;
  audience: NotificationAudience;
  /** Phone number, email address or internal channel id. */
  recipient: string;
  payload: NotificationPayload;
  bookingId: string | null;
};

/**
 * What an adapter must implement.
 *
 * `deliver` is intentionally allowed to be a no-op that only enqueues — for
 * WhatsApp, sending happens in a background worker against the Business
 * Platform API, not in the request that created the booking.
 */
export type ChannelAdapter = {
  channel: NotificationChannel;
  /** False disables the channel without removing its registration. */
  enabled: boolean;
  /**
   * Whether this adapter handles a given event/audience pair. Lets a channel
   * opt out of events it has no template for.
   */
  supports: (event: NotificationEvent, audience: NotificationAudience) => boolean;
  /** Resolve the address for this channel, or null to skip. */
  resolveRecipient: (request: NotificationRequest) => string | null;
  deliver: (request: NotificationRequest) => Promise<DeliveryResult>;
};

export type DeliveryResult =
  { ok: true; providerMessageId?: string } | { ok: false; error: string; retryable: boolean };
