import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { CalendarDays, LogOut, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listBookings, updateBookingStatus } from "@/lib/bookings.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Bookings Dashboard | Haji Ahli" },
      {
        name: "description",
        content: "Internal dashboard for reviewing and confirming Haji Ahli cleaning bookings.",
      },
      { property: "og:title", content: "Bookings Dashboard | Haji Ahli" },
      {
        property: "og:description",
        content: "Review, confirm and complete incoming cleaning bookings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["new", "confirmed", "completed", "cancelled"] as const;

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listBookings);
  const setStatus = useServerFn(updateBookingStatus);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings(),
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: (typeof STATUSES)[number] }) =>
      setStatus({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="min-h-screen bg-sand">
      <header className="border-b border-border bg-background">
        <div className="container-page flex h-16 items-center justify-between">
          <h1 className="font-display text-base font-bold">Bookings dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading bookings…</p>
        ) : error ? (
          <div className="surface-card p-6">
            <h2 className="font-display text-base font-bold">No access yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is signed in but has not been granted admin access to the
              bookings list.
            </p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No bookings yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {data.map((booking) => (
              <article key={booking.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold">
                      {booking.service}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(parseISO(booking.booking_date), "EEE d MMM yyyy")} ·{" "}
                      {booking.time_slot} · {booking.emirate}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                      booking.status === "new" && "bg-accent/15 text-accent",
                      booking.status === "confirmed" && "bg-primary/15 text-primary",
                      booking.status === "completed" && "bg-secondary text-secondary-foreground",
                      booking.status === "cancelled" && "bg-destructive/15 text-destructive",
                    )}
                  >
                    {booking.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Customer</dt>
                    <dd>{booking.customer_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Contact</dt>
                    <dd className="flex items-center gap-2">
                      <Phone className="size-3.5 text-primary" />
                      <a className="hover:underline" href={`tel:${booking.phone}`}>
                        {booking.phone}
                      </a>
                      {booking.email ? <span className="text-muted-foreground">· {booking.email}</span> : null}
                    </dd>
                  </div>
                  {booking.property_type ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Property</dt>
                      <dd>{booking.property_type}</dd>
                    </div>
                  ) : null}
                  {booking.address ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Address</dt>
                      <dd>{booking.address}</dd>
                    </div>
                  ) : null}
                  {booking.notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Notes</dt>
                      <dd>{booking.notes}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={mutation.isPending || booking.status === status}
                      onClick={() => mutation.mutate({ id: booking.id, status })}
                      className="rounded-md border border-input px-3 py-1.5 text-xs font-semibold capitalize hover:bg-secondary disabled:opacity-40"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
