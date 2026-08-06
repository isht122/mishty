import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Menu } from "@/components/Menu";
import { Testimonials } from "@/components/Testimonials";
import { ConsultationForm } from "@/components/ConsultationForm";
import { DeliveryAddressForm } from "@/components/DeliveryAddressForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Menu />
        <Testimonials />
        <div id="contact">
          <ConsultationForm />
          <DeliveryAddressForm />
        </div>
      </main>
      <Footer />
    </>
  );
}