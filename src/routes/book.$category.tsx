import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBookingCategory } from "@/data/booking-categories";

/**
 * Layout for the three-page booking flow.
 *
 * `/book/$category`           -> choose the service
 * `/book/$category/schedule`  -> choose date and arrival time
 * `/book/$category/details`   -> contact details and submit
 *
 * Splitting the flow across pages keeps one decision on screen at a time; the
 * selections travel in the URL so back and forward both work.
 */
export const Route = createFileRoute("/book/$category")({
  loader: ({ params }) => {
    const category = getBookingCategory(params.category);
    if (!category) throw notFound();
    return { category };
  },
  component: BookingLayout,
});

function BookingLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
