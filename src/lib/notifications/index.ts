import type {
  ChannelAdapter,
  NotificationAudience,
  NotificationChannel,
  NotificationEvent,
  NotificationRequest,
} from "./types";

export * from "./types";

/**
 * Notification dispatcher.
 *
 * Booking code calls `notify()` with an event and never learns which channels
 * ran. Registering WhatsApp later is a single `registerChannel()` call in
 * server startup — no change to any booking or UI component.
 *
 * Delivery failures are logged and swallowed. A booking must never fail
 * because a message could not be sent; the outbox row survives for retry.
 */
const adapters = new Map<NotificationChannel, ChannelAdapter>();

export function registerChannel(adapter: ChannelAdapter) {
  adapters.set(adapter.channel, adapter);
}

export function registeredChannels(): NotificationChannel[] {
  return [...adapters.values()].filter((a) => a.enabled).map((a) => a.channel);
}

/** For tests and for the admin panel's "which channels are live" display. */
export function isChannelEnabled(channel: NotificationChannel): boolean {
  return adapters.get(channel)?.enabled ?? false;
}

export type NotifyOutcome = {
  channel: NotificationChannel;
  delivered: boolean;
  error?: string;
};

/**
 * Fan an event out to every channel that supports it.
 *
 * Runs adapters concurrently and independently — one channel failing must not
 * prevent another from delivering.
 */
export async function notify(request: NotificationRequest): Promise<NotifyOutcome[]> {
  const applicable = [...adapters.values()].filter(
    (a) => a.enabled && a.supports(request.event, request.audience),
  );

  const results = await Promise.allSettled(
    applicable.map(async (adapter): Promise<NotifyOutcome> => {
      const recipient = adapter.resolveRecipient(request);
      if (!recipient) {
        return { channel: adapter.channel, delivered: false, error: "no recipient" };
      }
      const result = await adapter.deliver({ ...request, recipient });
      return result.ok
        ? { channel: adapter.channel, delivered: true }
        : { channel: adapter.channel, delivered: false, error: result.error };
    }),
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          channel: applicable[i]!.channel,
          delivered: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        },
  );
}

/** Convenience for the common "tell the customer and the office" pair. */
export async function notifyBoth(
  event: NotificationEvent,
  base: Omit<NotificationRequest, "event" | "audience">,
): Promise<NotifyOutcome[]> {
  const audiences: NotificationAudience[] = ["customer", "staff"];
  const all = await Promise.all(audiences.map((audience) => notify({ ...base, event, audience })));
  return all.flat();
}
