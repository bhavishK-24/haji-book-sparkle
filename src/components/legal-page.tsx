import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COMPANY } from "@/lib/company";

/**
 * Shared shell for the legal pages.
 *
 * Deliberately plainer than the marketing pages: someone reading terms is
 * looking for a specific clause, not being persuaded. Narrow measure, generous
 * line height, real headings they can scan and link to.
 */
export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  /** ISO date this document last changed. */
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className="surface-dark bg-primary-deep text-primary-foreground">
          <div className="container-page py-16 sm:py-20">
            <Reveal className="max-w-3xl">
              <p className="eyebrow text-primary-foreground/55">Legal</p>
              <h1 className="display-xl mt-5">{title}</h1>
              <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
                {intro}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="container-page section-y">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,42rem)_16rem] lg:gap-16">
            <div className="legal-prose">{children}</div>

            {/*
              The registered entity, address and TRN, on every legal page.
              A customer disputing a charge needs to know who they are dealing
              with without hunting for it.
            */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Registered business
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Legal entity</dt>
                    <dd className="mt-0.5 font-medium">{COMPANY.legalName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Registered address</dt>
                    <dd className="mt-0.5 leading-snug">{COMPANY.address}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">TRN</dt>
                    <dd className="mt-0.5 font-mono font-medium tabular-nums">{COMPANY.trn}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="mt-0.5">
                      <a
                        className="link-underline block"
                        href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                      >
                        {COMPANY.phone}
                      </a>
                      <a className="link-underline block" href={`mailto:${COMPANY.email}`}>
                        {COMPANY.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last updated</dt>
                    <dd className="mt-0.5 tabular-nums">{updated}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A numbered clause. Headings carry ids so a clause can be linked to. */
export function Clause({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  const id = `clause-${n.replace(/\./g, "-")}`;
  return (
    <section className="mt-10 first:mt-0 scroll-mt-24" id={id}>
      <h2 className="display-sm flex gap-3">
        <span className="font-mono text-sm font-semibold text-primary">{n}</span>
        <a href={`#${id}`} className="hover:text-primary">
          {title}
        </a>
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
