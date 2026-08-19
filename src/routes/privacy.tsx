import { createFileRoute, Link } from "@tanstack/react-router";
import { Clause, LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Haji Ahli" },
      {
        name: "description",
        content:
          "How Haji Ahli collects, uses and protects your personal data under the UAE Personal Data Protection Law, and the rights you have over it.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`How ${COMPANY.legalName} collects, uses and protects your personal data, and the rights you have over it under UAE law.`}
      updated="19 August 2026"
    >
      <Clause n="1" title="Who controls your data">
        <p>
          <strong>{COMPANY.legalName}</strong>, {COMPANY.address}, is the data controller for the
          information described here. Contact us about anything on this page at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or{" "}
          <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>.
        </p>
        <p>
          We process personal data in accordance with{" "}
          <strong>Federal Decree-Law No. 45 of 2021</strong> on the Protection of Personal Data (the
          UAE PDPL).
        </p>
      </Clause>

      <Clause n="2" title="What we collect">
        <p>When you book or enquire, we collect:</p>
        <ul>
          <li>
            <strong>Contact details</strong> — your name, phone number and, if you give it, email
            address.
          </li>
          <li>
            <strong>Service details</strong> — the property address, emirate, property type and
            size, furnishing, the service and extras you chose, your preferred date and arrival
            window, and any notes you write for the crew.
          </li>
          <li>
            <strong>Booking records</strong> — your booking reference, status, price and invoice.
          </li>
          <li>
            <strong>Correspondence</strong> — messages you send us by email, phone or WhatsApp.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect or store card or bank details on this website. We do
          not ask for Emirates ID, passport or other identity documents to book a residential
          service.
        </p>
        <p>
          We do not knowingly collect data from anyone under 18. If you believe a child has given us
          data, tell us and we will delete it.
        </p>
      </Clause>

      <Clause n="3" title="Why we use it, and our lawful basis">
        <ul>
          <li>
            <strong>To provide the service you booked</strong> — scheduling, dispatching a crew,
            reaching you on the day, invoicing. Basis: performance of our contract with you.
          </li>
          <li>
            <strong>To confirm and update you</strong> — the confirmation, arrival and completion
            messages tied to your booking. Basis: performance of our contract.
          </li>
          <li>
            <strong>To meet legal obligations</strong> — VAT records and tax invoices under Federal
            Decree-Law No. 8 of 2017. Basis: legal obligation.
          </li>
          <li>
            <strong>To handle complaints and warranty claims</strong>, and to defend or bring legal
            claims. Basis: our legitimate interests.
          </li>
          <li>
            <strong>To improve our service</strong> — understanding which services are booked and
            where. Basis: legitimate interests, using aggregated data wherever possible.
          </li>
        </ul>
        <p>
          We do not sell your data, and we do not use it for marketing unless you have asked us to.
        </p>
      </Clause>

      <Clause n="4" title="Who we share it with">
        <p>We share only what is necessary, and only with:</p>
        <ul>
          <li>
            <strong>our own crews and supervisors</strong>, who need the address, access notes and
            scope to do the job;
          </li>
          <li>
            <strong>our hosting and database provider</strong>, which stores booking records on our
            behalf;
          </li>
          <li>
            <strong>our email provider</strong>, to deliver booking confirmations and updates;
          </li>
          <li>
            <strong>professional advisers, insurers and auditors</strong>, where they need it;
          </li>
          <li>
            <strong>government authorities</strong>, where the law requires it.
          </li>
        </ul>
        <p>
          Service providers act on our instructions under contract and may not use your data for
          their own purposes.
        </p>
      </Clause>

      <Clause n="5" title="Transfers outside the UAE">
        <p>
          Some of our providers store data on servers outside the UAE. Where that happens we
          transfer data only to a country the UAE recognises as having adequate protection, or under
          contractual safeguards that meet the requirements of the PDPL. You can ask us where your
          data is held.
        </p>
      </Clause>

      <Clause n="6" title="How long we keep it">
        <ul>
          <li>
            <strong>Booking and invoice records:</strong> five years from the end of the tax year,
            which is the retention period UAE VAT law requires.
          </li>
          <li>
            <strong>Enquiries that did not become bookings:</strong> up to 12 months.
          </li>
          <li>
            <strong>Correspondence:</strong> up to 24 months, or longer where a complaint or claim
            is open.
          </li>
        </ul>
        <p>After that we delete it, or anonymise it so it can no longer identify you.</p>
      </Clause>

      <Clause n="7" title="Your rights">
        <p>Under the UAE PDPL you have the right to:</p>
        <ul>
          <li>be told how your data is processed, and receive a copy of it;</li>
          <li>have inaccurate or incomplete data corrected;</li>
          <li>have your data deleted, where we have no lawful reason to keep it;</li>
          <li>restrict or object to processing in certain circumstances;</li>
          <li>receive your data in a portable, machine-readable form;</li>
          <li>withdraw consent, where consent is the basis we relied on.</li>
        </ul>
        <p>
          Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> to exercise any of these. We
          respond within 30 days. There is no charge. We may ask you to confirm your identity so we
          do not disclose your data to someone else.
        </p>
        <p>
          Note that we cannot delete records we are legally required to keep — a tax invoice, for
          example — until the retention period expires.
        </p>
      </Clause>

      <Clause n="8" title="Security">
        <p>
          Booking data is held in an access-controlled database with row-level security, encrypted
          in transit and at rest. Only authorised staff can view bookings, and access is limited to
          what each role needs. Our website is served over HTTPS.
        </p>
        <p>
          No system is perfectly secure. If a breach affects your personal data and poses a risk to
          you, we will notify you and the UAE Data Office as the PDPL requires.
        </p>
      </Clause>

      <Clause n="9" title="Cookies and analytics">
        <p>
          This website uses only what it needs to work — session and preference storage, and sign-in
          state for staff using the internal dashboard. We do not use advertising cookies and we do
          not track you across other websites.
        </p>
        <p>
          Where we measure how the site is used, it is to see which services are booked and where
          people get stuck, not to build a profile of you.
        </p>
      </Clause>

      <Clause n="10" title="WhatsApp and phone">
        <p>
          If you contact us on WhatsApp, your message and number are processed by WhatsApp under its
          own privacy terms as well as ours. We use WhatsApp only to arrange and discuss your
          booking. Calls may be noted for accuracy but are not recorded.
        </p>
      </Clause>

      <Clause n="11" title="Changes">
        <p>
          We may update this policy. The date at the top shows when it last changed. Material
          changes affecting how we use existing data will be communicated to you directly.
        </p>
      </Clause>

      <Clause n="12" title="Complaints">
        <p>
          Raise a concern with us first at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
          If you are not satisfied, you may complain to the <strong>UAE Data Office</strong>, or,
          for consumer matters, to the Ministry of Economy on 600 522 225 or at{" "}
          <a href="https://www.consumerrights.ae" rel="noopener noreferrer" target="_blank">
            consumerrights.ae
          </a>
          .
        </p>
        <p>
          See also our <Link to="/terms">terms and conditions</Link> and{" "}
          <Link to="/cancellation">cancellation policy</Link>.
        </p>
      </Clause>
    </LegalPage>
  );
}
