import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { EMIRATES, PROPERTY_TYPES, RETAIL_SERVICES, TIME_SLOTS } from "@/lib/company";
import { createBooking } from "@/lib/bookings.functions";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function BookingForm({ defaultService }: { defaultService?: string }) {
  const submit = useServerFn(createBooking);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string>("");
  const [service, setService] = useState(
    RETAIL_SERVICES.some((s) => s.name === defaultService)
      ? defaultService!
      : RETAIL_SERVICES[0]!.name,
  );
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, string>) => submit({ data: payload as never }),
    onSuccess: () => {
      setDone(true);
      track("booking_submitted", { service, time_slot: slot });
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong."),
  });

  if (done) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/20 text-accent-foreground">
          <CalendarCheck className="size-6" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold">Request received</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Our team will call you shortly to confirm your {service.toLowerCase()} slot
          {date ? ` on ${format(date, "d MMMM yyyy")}` : ""} {slot ? `(${slot})` : ""}.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setDate(undefined);
            setSlot("");
          }}
          className="mt-6 rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          Book another slot
        </button>
      </div>
    );
  }

  return (
    <form
      className="surface-card p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!date) {
          toast.error("Please pick a date on the calendar.");
          return;
        }
        if (!slot) {
          toast.error("Please choose a time slot.");
          return;
        }
        const form = new FormData(event.currentTarget);
        mutation.mutate({
          customer_name: String(form.get("customer_name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          service,
          property_type: String(form.get("property_type") ?? ""),
          emirate: String(form.get("emirate") ?? ""),
          address: String(form.get("address") ?? ""),
          booking_date: format(date, "yyyy-MM-dd"),
          time_slot: slot,
          notes: String(form.get("notes") ?? ""),
        });
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        <div>
          <span className={labelClass}>Pick a date</span>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={[{ before: new Date() }, { dayOfWeek: [5] }]}
            className="rounded-lg border border-border bg-card p-3"
          />
          <p className="mt-2 text-xs text-muted-foreground">Closed Fridays.</p>
          <div className="mt-5">
            <span className={labelClass}>Time slot</span>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSlot(t)}
                  className={cn(
                    "rounded-md border border-input px-3 py-2 text-xs font-semibold transition-colors hover:border-primary",
                    slot === t && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div>
            <label className={labelClass} htmlFor="service">
              Service
            </label>
            <select
              id="service"
              className={fieldClass}
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              {RETAIL_SERVICES.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="customer_name">
                Full name
              </label>
              <input id="customer_name" name="customer_name" required maxLength={100} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone / WhatsApp
              </label>
              <input id="phone" name="phone" required maxLength={30} className={fieldClass} placeholder="+971 5x xxx xxxx" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="email">
                Email (optional)
              </label>
              <input id="email" name="email" type="email" maxLength={255} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="emirate">
                Emirate
              </label>
              <select id="emirate" name="emirate" required className={fieldClass}>
                {EMIRATES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="property_type">
                Property type
              </label>
              <select id="property_type" name="property_type" className={fieldClass}>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="address">
                Area / address
              </label>
              <input id="address" name="address" maxLength={400} className={fieldClass} placeholder="Building, area" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="notes">
              Anything we should know?
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={1000} className={fieldClass} />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Request this slot
          </button>
          <p className="text-xs text-muted-foreground">
            Slots are confirmed by phone. No payment is taken online yet.
          </p>
        </div>
      </div>
    </form>
  );
}
