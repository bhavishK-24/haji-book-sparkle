import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MailWarning,
  Phone,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatAed } from "@/data/pricing";
import { supabase } from "@/integrations/supabase/client";
import {
  type BookingStatus,
  STATUS_TRANSITIONS,
  listBookings,
  listNotifications,
  updateBookingStatus,
} from "@/lib/bookings.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Bookings Dashboard | Haji Ahli" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

/** Operational ordering, not alphabetical: what needs doing comes first. */
const FILTERS = [
  { id: "new", label: "Needs confirming" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-accent/15 text-accent ring-1 ring-accent/30",
  confirmed: "bg-primary/12 text-primary ring-1 ring-primary/30",
  completed: "bg-secondary text-muted-foreground ring-1 ring-border",
  cancelled: "bg-destructive/10 text-destructive ring-1 ring-destructive/25",
};

/** What the button says, rather than the raw status name. */
const ACTION_LABEL: Record<BookingStatus, string> = {
  new: "Reopen",
  confirmed: "Confirm",
  completed: "Mark completed",
  cancelled: "Cancel",
};

type BookingRow = Record<string, unknown> & { id: string; status: BookingStatus };
type NotificationRow = {
  booking_id: string | null;
  event: string;
  audience: string;
  status: string;
  last_error: string | null;
};

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const n = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** "about 4h 30m" — the estimate the crew is scheduled against. */
function durationLabel(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `~${h}h ${m}m`;
  if (h) return `~${h}h`;
  return `~${m}m`;
}

function addOnLabel(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .map((a) => {
      const o = a as { name?: string; quantity?: number | null };
      return o?.quantity ? `${o.name} ×${o.quantity}` : o?.name;
    })
    .filter(Boolean)
    .join(", ");
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-snug">{value}</dd>
    </div>
  );
}

/**
 * Delivery state for one booking's notifications.
 *
 * A confirmation that failed to send is worse than one never triggered: the
 * office believes the customer knows. Anything not "sent" is surfaced here.
 */
function DeliveryBadge({ rows }: { rows: NotificationRow[] }) {
  if (rows.length === 0) return null;
  const failed = rows.filter((r) => r.status === "failed");
  const pending = rows.filter((r) => r.status === "pending");
  const sent = rows.filter((r) => r.status === "sent");

  if (failed.length > 0) {
    return (
      <span
        title={failed.map((f) => `${f.event}/${f.audience}: ${f.last_error ?? ""}`).join("\n")}
        className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-destructive ring-1 ring-destructive/25"
      >
        <MailWarning className="size-3" aria-hidden />
        {failed.length} email failed
      </span>
    );
  }
  if (pending.length > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[0.6875rem] font-semibold text-muted-foreground ring-1 ring-border">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        {pending.length} email queued
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-primary ring-1 ring-primary/25">
      <Mail className="size-3" aria-hidden />
      {sent.length} sent
    </span>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listBookings);
  const fetchNotifications = useServerFn(listNotifications);
  const setStatus = useServerFn(updateBookingStatus);

  const [filter, setFilter] = useState<FilterId>("new");
  const [busyId, setBusyId] = useState<string | null>(null);

  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings(),
    /* A work queue goes stale fast; refetch when the tab regains focus. */
    refetchOnWindowFocus: true,
  });

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    refetchOnWindowFocus: true,
  });

  /*
   * Realtime, so a booking taken by a colleague appears without anyone
   * pressing refresh. Falls back silently to focus-refetch if the channel
   * cannot connect — a dashboard that works is better than one that insists on
   * websockets.
   */
  useEffect(() => {
    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: BookingStatus }) => setStatus({ data: input }),
    onMutate: (input) => setBusyId(input.id),
    onSuccess: (_r, input) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Booking marked ${input.status}.`);
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setBusyId(null),
  });

  const rows = (bookings.data ?? []) as BookingRow[];

  const notificationsByBooking = useMemo(() => {
    const map = new Map<string, NotificationRow[]>();
    for (const raw of (notifications.data ?? []) as NotificationRow[]) {
      if (!raw.booking_id) continue;
      const list = map.get(raw.booking_id) ?? [];
      list.push(raw);
      map.set(raw.booking_id, list);
    }
    return map;
  }, [notifications.data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-sand focus:outline-none">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-base font-bold">Bookings</h1>
            {counts["new"] ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                {counts["new"]} need confirming
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                bookings.refetch();
                notifications.refetch();
              }}
            >
              <RefreshCw className={cn("size-4", bookings.isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="container-page flex flex-wrap gap-2 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-[var(--dur-base)]",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-secondary",
              )}
            >
              {f.label}
              <span className={cn("tabular-nums", filter === f.id ? "opacity-70" : "opacity-50")}>
                {counts[f.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="container-page py-8">
        {bookings.isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading bookings…
          </div>
        ) : bookings.error ? (
          /*
           * Two very different failures land here — no role granted yet, and a
           * genuine error. The server distinguishes them, so show its message
           * rather than guessing.
           */
          <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.04] p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <ShieldAlert className="size-4 text-destructive" aria-hidden />
              Cannot load bookings
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {(bookings.error as Error).message}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => bookings.refetch()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            {rows.length === 0 ? (
              <>
                <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
                <p className="mt-3 text-sm font-medium">No bookings yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New requests from the website appear here immediately.
                </p>
              </>
            ) : (
              <>
                <Check className="mx-auto size-8 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-medium">
                  Nothing in “{FILTERS.find((f) => f.id === filter)?.label}”
                </p>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="link-underline mt-2 text-sm font-medium text-primary"
                >
                  Show all bookings
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {visible.map((b) => {
              const status = b.status;
              const next = STATUS_TRANSITIONS[status] ?? [];
              const busy = busyId === b.id && mutation.isPending;
              const price = n(b["price_amount"]);
              const extras = addOnLabel(b["add_ons"]);
              const date = s(b["booking_date"]);
              const start = s(b["requested_start"]);

              return (
                <article
                  key={b.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-mono text-sm font-bold tracking-tight">
                          {s(b["reference"]) ?? "—"}
                        </span>
                        <h2 className="font-display text-base font-bold">
                          {s(b["service"]) ?? "Service"}
                        </h2>
                        {s(b["service_id"]) ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {s(b["service_id"])}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {date ? format(parseISO(date), "EEE d MMM yyyy") : "—"} ·{" "}
                        {start ? start.slice(0, 5) : (s(b["time_slot"]) ?? "—")}
                        {durationLabel(n(b["estimated_minutes"]))
                          ? ` · ${durationLabel(n(b["estimated_minutes"]))}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em]",
                          STATUS_STYLE[status],
                        )}
                      >
                        {status}
                      </span>
                      <DeliveryBadge rows={notificationsByBooking.get(b.id) ?? []} />
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Customer" value={s(b["customer_name"])} />
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Contact
                      </dt>
                      <dd className="mt-0.5 text-sm leading-snug">
                        <a
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                          href={`tel:${String(b["phone"] ?? "").replace(/\s/g, "")}`}
                        >
                          <Phone className="size-3.5 text-primary" aria-hidden />
                          {s(b["phone"]) ?? "—"}
                        </a>
                        {s(b["email"]) ? (
                          <a
                            className="mt-0.5 block truncate text-muted-foreground hover:text-primary"
                            href={`mailto:${s(b["email"])}`}
                          >
                            {s(b["email"])}
                          </a>
                        ) : (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            No email — cannot send confirmation
                          </span>
                        )}
                      </dd>
                    </div>
                    <Field
                      label="Property"
                      value={
                        [s(b["property_size"]), s(b["furnishing"]), s(b["property_type"])]
                          .filter(Boolean)
                          .join(" · ") || null
                      }
                    />
                    <Field label="Emirate" value={s(b["emirate"])} />
                    <Field label="Address" value={s(b["address"])} />
                    <Field label="Extras" value={extras} />
                    <Field
                      label="Price"
                      value={
                        price === null
                          ? "Not priced"
                          : `${formatAed(Math.round(price * 1.05 * 100) / 100)} incl. VAT`
                      }
                    />
                    {s(b["notes"]) ? (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          Notes
                        </dt>
                        <dd className="mt-0.5 text-sm leading-relaxed">{s(b["notes"])}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {/*
                    Only the transitions this status actually allows. Showing all
                    four invited completing a booking nobody had confirmed — and
                    every transition emails the customer.
                  */}
                  {next.length > 0 ? (
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      {next.map((target) => (
                        <Button
                          key={target}
                          size="sm"
                          variant={target === "cancelled" ? "outline" : "default"}
                          disabled={busy}
                          onClick={() => mutation.mutate({ id: b.id, status: target })}
                        >
                          {busy ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : target === "cancelled" ? (
                            <X className="size-3.5" aria-hidden />
                          ) : (
                            <Check className="size-3.5" aria-hidden />
                          )}
                          {ACTION_LABEL[target]}
                        </Button>
                      ))}
                      {status === "new" ? (
                        <span className="text-xs text-muted-foreground">
                          Confirming emails the customer their confirmation.
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                      <AlertTriangle className="size-3.5" aria-hidden />
                      {status === "completed"
                        ? "Completed bookings are final. Create a new booking for repeat work."
                        : "Cancelled bookings are final. Create a new booking to rebook."}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {rows.length > 0 ? (
          <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            Showing the 200 most recent bookings. Updates appear automatically.
          </p>
        ) : null}
      </div>
    </main>
  );
}
