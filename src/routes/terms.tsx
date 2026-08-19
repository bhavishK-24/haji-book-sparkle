import { createFileRoute, Link } from "@tanstack/react-router";
import { Clause, LegalPage } from "@/components/legal-page";
import { CANCELLATION_POLICY as P, COMPANY, MATERIALS_POLICY } from "@/lib/company";
import { MINIMUM_BOOKING_VALUE, VAT_RATE } from "@/data/pricing";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Haji Ahli" },
      {
        name: "description",
        content:
          "The terms on which Haji Ahli provides cleaning and maintenance services in the UAE — booking, pricing, VAT, access, liability and dispute resolution.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      intro={`These are the terms on which ${COMPANY.legalName} provides cleaning and maintenance services. Booking a service means you accept them.`}
      updated="19 August 2026"
    >
      <Clause n="1" title="Who you are contracting with">
        <p>
          Services are provided by <strong>{COMPANY.legalName}</strong>, a limited liability company
          registered in {COMPANY.emirate}, United Arab Emirates, at {COMPANY.address}. Our VAT
          registration number (TRN) is <strong>{COMPANY.trn}</strong>.
        </p>
        <p>
          In these terms, "we" and "us" mean {COMPANY.legalName}; "you" means the person or business
          booking a service.
        </p>
      </Clause>

      <Clause n="2" title="Booking and confirmation">
        <p>
          Submitting a booking on this website is a <strong>request</strong>, not a concluded
          contract. A coordinator contacts you to confirm scope, access, timing and price. The
          contract forms when we confirm your booking, and you receive a booking reference in the
          form HA-XXXXXX.
        </p>
        <p>
          We may decline a booking — for example where the property is outside our service area, the
          work falls outside our licence, or the site is unsafe to work in.
        </p>
        <p>
          Bookings are made under Federal Decree-Law No. 46 of 2021 on Electronic Transactions and
          Trust Services. You agree that an electronic confirmation is as binding as a signed
          document.
        </p>
      </Clause>

      <Clause n="3" title="Arrival windows, not appointment times">
        <p>
          We schedule an <strong>arrival window</strong>. Traffic, building access and the job
          before yours all affect timing, so a window is an honest commitment where a precise minute
          would not be. We call you if the crew is running outside the window.
        </p>
      </Clause>

      <Clause n="4" title="Prices, VAT and what is included">
        <p>
          All prices shown to consumers on this website include{" "}
          <strong>{VAT_RATE * 100}% VAT</strong>, as required by Federal Decree-Law No. 8 of 2017 on
          Value Added Tax and the UAE Consumer Protection regulations. Where we show a figure
          excluding VAT it is labelled as such and the VAT is stated separately.
        </p>
        <p>
          A minimum booking value of {P.currency} {MINIMUM_BOOKING_VALUE} (before VAT) applies,
          since below that the cost of sending a crew and vehicle exceeds the job.
        </p>
        <p>
          {MATERIALS_POLICY.detail} {MATERIALS_POLICY.byoNote}
        </p>
        <p>
          A valid tax invoice showing our TRN and the VAT charged is issued for every job. Ask us if
          you need it addressed to a company.
        </p>
      </Clause>

      <Clause n="5" title="Prices that depend on what you tell us">
        <p>
          Many of our prices depend on information only you can give us — the size of the property,
          how many bathrooms, the condition of a kitchen. Those prices are firm for the description
          you gave.
        </p>
        <p>
          If the job on arrival is materially different from the description, the crew will{" "}
          <strong>show you a revised price before starting any work</strong>, with photographs where
          condition is the reason. You may then proceed, reduce the scope, or cancel at no charge.
          We will never start at one price and invoice at another.
        </p>
      </Clause>

      <Clause n="6" title="Access, and what we need from you">
        <p>You agree to:</p>
        <ul>
          <li>
            provide access at the agreed time, or arrange keys, codes and building permissions;
          </li>
          <li>
            secure cash, jewellery, documents and any irreplaceable or fragile item before we
            arrive;
          </li>
          <li>tell us about pets, damaged fittings, faulty utilities or anything unsafe;</li>
          <li>ensure water and electricity are available at the property.</li>
        </ul>
        <p>
          Our crews do not move furniture or items over 20 kg, and do not work at height outside the
          scope of the service you booked.
        </p>
      </Clause>

      <Clause n="7" title="Cancellation, rescheduling and refunds">
        <p>
          Free cancellation up to {P.freeCancellationHours} hours before arrival and free
          rescheduling up to {P.freeRescheduleHours} hours before. Full detail, including the{" "}
          {P.currency} {P.lateCancellationFee} late-cancellation and no-access charges, is on the{" "}
          <Link to="/cancellation">cancellation policy</Link> page, which forms part of these terms.
        </p>
      </Clause>

      <Clause n="8" title="If something is not right">
        <p>
          Tell us within <strong>24 hours</strong> of the visit. Where work has fallen short of the
          scope you booked we will return and put it right at no charge. This is in addition to your
          statutory rights under Federal Law No. 15 of 2020 on Consumer Protection and Cabinet
          Decision No. 66 of 2023, which we do not seek to limit.
        </p>
        <p>
          Pest control treatments carry a three-month warranty: if the problem returns within three
          months of treatment we re-treat at no charge.
        </p>
      </Clause>

      <Clause n="9" title="Damage and liability">
        <p>
          We are insured, and we take responsibility for loss or damage caused by our negligence.
          Report any damage within 24 hours so we can inspect it.
        </p>
        <p>We are not responsible for:</p>
        <ul>
          <li>
            pre-existing damage, wear, or defects in fittings, grout, sealant or worn surfaces that
            cleaning reveals rather than causes;
          </li>
          <li>
            items that were already loose, cracked or failing, or surfaces whose manufacturer
            prohibits the treatment required;
          </li>
          <li>
            outcomes on surfaces you asked us to treat against our advice, or using products you
            supplied.
          </li>
        </ul>
        <p>
          Except for death or personal injury caused by our negligence, and except where UAE law
          does not permit a limit, our total liability for any single booking is limited to the
          amount you paid for it. Nothing in these terms limits any liability that cannot lawfully
          be limited.
        </p>
      </Clause>

      <Clause n="10" title="Our people">
        <p>
          Crews are directly employed, uniformed and supervised. Please do not offer direct
          employment, side work or cash payment to a crew member — payment is only ever to the
          company.
        </p>
      </Clause>

      <Clause n="11" title="Commercial and contracted work">
        <p>
          Commercial cleaning, annual maintenance contracts, manpower supply and post-handover work
          are arranged by quotation or site survey and are governed by the terms of the signed
          contract or quotation for that work. Where those terms differ from this page, the signed
          contract applies.
        </p>
        <p>
          Watchman supply is provided under our watchman licence. We do not provide licensed
          security-guard services.
        </p>
      </Clause>

      <Clause n="12" title="Your personal information">
        <p>
          How we collect and use your information is set out in our{" "}
          <Link to="/privacy">privacy policy</Link>, which forms part of these terms.
        </p>
      </Clause>

      <Clause n="13" title="Governing law and disputes">
        <p>
          These terms are governed by the federal laws of the United Arab Emirates and the laws of
          the Emirate of {COMPANY.emirate}. The courts of {COMPANY.emirate} have exclusive
          jurisdiction.
        </p>
        <p>
          If we cannot resolve a complaint between us, you may raise it with the UAE Ministry of
          Economy consumer protection service on 600 522 225 or at{" "}
          <a href="https://www.consumerrights.ae" rel="noopener noreferrer" target="_blank">
            consumerrights.ae
          </a>
          , or with Dubai Economy and Tourism.
        </p>
      </Clause>

      <Clause n="14" title="Changes to these terms">
        <p>
          We may update these terms. The version that applies to your booking is the one published
          when you booked. The date at the top of this page shows when it last changed.
        </p>
      </Clause>

      <Clause n="15" title="Contact">
        <p>
          {COMPANY.legalName}, {COMPANY.address}. Phone{" "}
          <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>, email{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </Clause>
    </LegalPage>
  );
}
