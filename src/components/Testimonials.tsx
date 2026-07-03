import { Star } from "lucide-react";
import { testimonials } from "@/data/testimonials";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-gold text-gold" : "fill-ivory-dark text-ivory-dark"
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Customer Love
          </p>
          <h2 className="section-heading mb-4 text-3xl font-bold text-maroon sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Hear from the women who wear our handpainted creations with pride
            and joy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="flex flex-col rounded-2xl border border-ivory-dark bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <StarRating rating={testimonial.rating} />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-text-muted">
                &ldquo;{testimonial.review}&rdquo;
              </blockquote>
              <footer className="mt-5 border-t border-ivory-dark pt-4">
                <p className="font-semibold text-maroon">{testimonial.name}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
