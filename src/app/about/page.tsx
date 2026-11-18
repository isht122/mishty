import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Renuka | Renuka’s Art Collection",
  description:
    "Renuka is an artist with an M.A. in Painting and 12 years of experience. Every handpainted piece is made only once.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ivory">
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-32 text-text-primary">
          <h1 className="font-serif text-4xl text-maroon md:text-5xl">
            Painted by hand, made once
          </h1>

          <p className="mt-8 text-lg leading-relaxed">
            Renuka’s Art Collection is the work of Renuka, an artist with an
            M.A. in Painting and 12 years of experience. She began with a brush
            and a love for colour, and over the years that became sarees, cord
            sets, dupattas, 3-piece suits, tops, shirts and short kurtis.
          </p>
          <p className="mt-5 text-lg leading-relaxed">
            Every piece is made only once. We do not repeat a design, so the one
            you choose belongs to you alone.
          </p>

          <h2 className="mt-14 font-serif text-2xl text-maroon md:text-3xl">
            A small imperfection is a sign of honest work
          </h2>
          <p className="mt-5 text-lg leading-relaxed">
            You may notice a slight difference in a line, or a brushstroke that
            is not exactly like the one beside it. This is how you can tell a
            piece is handmade.
          </p>
          <p className="mt-5 text-lg leading-relaxed">
            A machine makes a piece perfect because it repeats the same movement
            exactly, every time, so thousands of pieces come out identical. A
            hand cannot do that. Each stroke is a little different, and that is
            why no two handpainted pieces are alike. So when you see a small
            imperfection, it tells you a person made the piece with care.
          </p>

          <h2 className="mt-14 font-serif text-2xl text-maroon md:text-3xl">
            For those who look closely
          </h2>
          <p className="mt-5 text-lg leading-relaxed">
            Some women look for more than a printed pattern. They notice the
            fabric, the finish and whether something was made with thought. If
            you are one of them, we hope you will find something here that suits
            you.
          </p>

          <h2 className="mt-14 font-serif text-2xl text-maroon md:text-3xl">
            Your own idea
          </h2>
          <p className="mt-5 text-lg leading-relaxed">
            If you have a design in mind, you are welcome to share it with us.
            We will talk it through and paint it into a dress made for you.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/#contact"
              className="rounded-full bg-maroon px-6 py-3 text-white transition hover:bg-maroon-dark"
            >
              Share your idea
            </Link>
            <Link
              href="/"
              className="rounded-full border border-maroon px-6 py-3 text-maroon transition hover:bg-ivory-dark"
            >
              See the collection
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}