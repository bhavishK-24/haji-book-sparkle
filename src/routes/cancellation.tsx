import { createFileRoute } from "@tanstack/react-router";
import { Clause, LegalPage } from "@/components/legal-page";
import { CANCELLATION_POLICY as P, COMPANY } from "@/lib/company";

export const Route = createFileRoute("/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation & Rescheduling Policy | Haji Ahli" },
      {
        name: "description",
        content: `Cancel free up to ${P.freeCancellationHours} hours before your visit and reschedule up to ${P.freeRescheduleHours} hours before. Full policy, fees and refund terms.`,
      },
    ],
  }),
  component: CancellationPage,
});

const aed = (n: number) => `${P.currency} ${n}`;

function CancellationPage() {
  return (
    <LegalPage
      title="Cancellation & rescheduling"
      intro={`Plans change. You can cancel free of charge up to ${P.freeCancellationHours} hours before your visit, and reschedule up to ${P.freeRescheduleHours} hours before. Everything below is the detail behind those two numbers.`}
      updated="19 August 2026"
    >
      {/*
        The two numbers a customer actually came for, before any prose. Nobody
        reads a cancellation policy for pleasure — they read it because
        something has come up and they need one figure.
      */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
          <p className="font-display text-3xl font-bold tabular-nums text-foreground">
            {P.freeCancellationHours} hours
          </p>
          <p className="mt-1 text-sm">Free cancellation before your visit</p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
          <p className="font-display text-3xl font-bold tabular-nums text-foreground">
            {P.freeRescheduleHours} hours
          </p>
          <p className="mt-1 text-sm">Free rescheduling before your visit</p>
        </div>
      </div>

      <Clause n="1" title="Cancelling your booking">
        <p>
          Cancel more than <strong>{P.freeCancellationHours} hours</strong> before your scheduled
          arrival window and there is no charge at all. If you have already paid, you are refunded
          in full.
        </p>
        <p>
          Cancel inside that window and a fixed <strong>{aed(P.lateCancellationFee)}</strong> charge
          applies. That covers the crew and vehicle already committed to your slot — at short notice
          we cannot fill it with another job.
        </p>
      </Clause>

      <Clause n="2" title="Rescheduling">
        <p>
          You can move your booking free of charge up to{" "}
          <strong>{P.freeRescheduleHours} hours</strong> before arrival. Call or WhatsApp us and we
          will find another slot.
        </p>
        <p>
          A booking can be rescheduled <strong>up to {P.maxReschedules} times</strong>. After that,
          please cancel and book again when your dates are settled.
        </p>
      </Clause>

      <Clause n="3" title="If we cannot get in">
        <p>
          If nobody is at the property, or the crew cannot access it, we wait, call you, and if we
          still cannot start we have to treat the visit as attended. A{" "}
          <strong>{aed(P.noAccessFee)}</strong> charge applies.
        </p>
        <p>
          Please make sure someone is there, or that keys, access codes and building permissions are
          arranged before the day. If your building requires a work permit or security clearance,
          tell us in the booking notes, or reply to your confirmation email.
        </p>
      </Clause>

      <Clause n="4" title="If the property is not as described">
        <p>
          Our prices depend on what you tell us — the size of the property, how many bathrooms, the
          condition of the kitchen. If the crew arrives and the job is materially different from the
          description, we <strong>re-quote before starting any work</strong>.
        </p>
        <p>
          You will be shown the revised price, and photographs where condition is the reason. You
          are then free to go ahead, reduce the scope, or cancel with no charge. We never begin work
          at one price and invoice at another.
        </p>
      </Clause>

      <Clause n="5" title="If we cancel">
        <p>{P.companyCancellation}</p>
        <p>
          Where a visit cannot go ahead because of weather, a utility failure, a building-wide
          restriction or another operational circumstance outside anyone's control:{" "}
          <strong>{P.forceMajeure}</strong>
        </p>
      </Clause>

      <Clause n="6" title="Commercial and quoted work">
        <p>
          Bookings arranged by quotation or site survey — commercial contracts, annual maintenance,
          manpower supply and post-handover work — are governed by the terms of their own contract,
          not by this page. Where the two differ, the signed contract applies.
        </p>
      </Clause>

      <Clause n="7" title="How to cancel or reschedule">
        <p>
          Call or WhatsApp <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>,
          or email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, quoting your booking
          reference. The reference is on your confirmation and looks like <strong>HA-XXXXXX</strong>
          .
        </p>
        <p>
          Timings are measured against the start of your arrival window, in UAE time (GST, UTC+4).
        </p>
      </Clause>
    </LegalPage>
  );
}
