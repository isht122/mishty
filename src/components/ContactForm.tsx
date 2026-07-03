"use client";

import { useState, FormEvent } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { indianStates, consultationTimeSlots } from "@/data/indian-states";
import { validateEmail, validatePhone, validatePincode } from "@/lib/validation";
import { SuccessToast } from "@/components/SuccessToast";
import { ConsultationFormData, FormErrors } from "@/types";

const MOCK_BOOKED_SLOTS = new Set(["2026-06-25-10:00 AM", "2026-06-25-2:00 PM"]);

const initialForm: ConsultationFormData = {
  fullName: "",
  email: "",
  phone: "",
  country: "India",
  streetAddress: "",
  townCity: "",
  state: "",
  pincode: "",
  createAccount: false,
  orderNotes: "",
  specialRequests: "",
  consultationDate: "",
  consultationTime: "",
};

export function ContactForm() {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState<ConsultationFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<string | null>(null);

  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name,
        email: user.email,
      }));
    }
  }

  const updateField = <K extends keyof ConsultationFormData>(
    field: K,
    value: ConsultationFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const isSlotBooked = (date: string, time: string) =>
    MOCK_BOOKED_SLOTS.has(`${date}-${time}`);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!form.country.trim()) newErrors.country = "Country is required";
    if (!form.streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!form.townCity.trim()) newErrors.townCity = "Town/City is required";
    if (!form.state) newErrors.state = "Please select a state";
    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!validatePincode(form.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    if (!form.consultationDate)
      newErrors.consultationDate = "Please select a consultation date";
    if (!form.consultationTime)
      newErrors.consultationTime = "Please select a time slot";
    else if (isSlotBooked(form.consultationDate, form.consultationTime)) {
      newErrors.consultationTime = "This time slot is already booked. Please choose another.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;

    const { error } = await supabase.from("consultations").insert({
      user_id: userId,
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      country: form.country,
      street_address: form.streetAddress,
      town_city: form.townCity,
      state: form.state,
      pincode: form.pincode,
      order_notes: form.orderNotes || null,
      special_requests: form.specialRequests || null,
      consultation_date: form.consultationDate,
      consultation_time: form.consultationTime,
    });

    if (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Failed to book consultation: ${error.message}`,
      }));
      setIsSubmitting(false);
      return;
    }

    const details = [
      `Name: ${form.fullName}`,
      `Date: ${form.consultationDate}`,
      `Time: ${form.consultationTime}`,
      `Delivery: ${form.streetAddress}, ${form.townCity}, ${form.state} - ${form.pincode}`,
    ].join("\n");

    setBookingDetails(details);
    setSuccessMessage(
      "Your consultation has been booked successfully! We'll contact you shortly to confirm the details."
    );
    setIsSubmitting(false);

    if (!isAuthenticated) {
      setForm(initialForm);
    } else if (user) {
      setForm({
        ...initialForm,
        fullName: user.name,
        email: user.email,
      });
    }
  };

  const inputClass =
    "w-full rounded-xl border border-ivory-dark bg-ivory px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted/60 focus:border-maroon focus:ring-2 focus:ring-maroon/10";
  const labelClass = "mb-1.5 block text-sm font-medium text-text-primary";
  const errorClass = "mt-1 text-xs text-red-500";

  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="contact" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Get in Touch
          </p>
          <h2 className="section-heading mb-4 text-3xl font-bold text-maroon sm:text-4xl">
            Book a Consultation
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Fill in your details and delivery address below. Our team will reach
            out to schedule your personal consultation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-ivory-dark bg-ivory/30 p-6 shadow-soft sm:p-10"
        >
          {errors.form && (
            <p className="mb-6 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {errors.form}
            </p>
          )}
          <div className="mb-8">
            <h3 className="section-heading mb-4 flex items-center gap-2 text-lg font-semibold text-maroon">
              <Calendar className="h-5 w-5" />
              Consultation Schedule
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="consultationDate" className={labelClass}>
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="consultationDate"
                  type="date"
                  min={today}
                  value={form.consultationDate}
                  onChange={(e) => updateField("consultationDate", e.target.value)}
                  className={inputClass}
                />
                {errors.consultationDate && (
                  <p className={errorClass}>{errors.consultationDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="consultationTime" className={labelClass}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Time Slot <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  id="consultationTime"
                  value={form.consultationTime}
                  onChange={(e) => updateField("consultationTime", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a time slot</option>
                  {consultationTimeSlots.map((slot) => {
                    const booked =
                      form.consultationDate &&
                      isSlotBooked(form.consultationDate, slot);
                    return (
                      <option key={slot} value={slot} disabled={!!booked}>
                        {slot}
                        {booked ? " (Booked)" : ""}
                      </option>
                    );
                  })}
                </select>
                {errors.consultationTime && (
                  <p className={errorClass}>{errors.consultationTime}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-heading mb-4 text-lg font-semibold text-maroon">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className={labelClass}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
                {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-heading mb-4 flex items-center gap-2 text-lg font-semibold text-maroon">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className={labelClass}>
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className={inputClass}
                  autoComplete="country-name"
                />
                {errors.country && <p className={errorClass}>{errors.country}</p>}
              </div>
              <div>
                <label htmlFor="townCity" className={labelClass}>
                  Town / City <span className="text-red-500">*</span>
                </label>
                <input
                  id="townCity"
                  type="text"
                  value={form.townCity}
                  onChange={(e) => updateField("townCity", e.target.value)}
                  className={inputClass}
                  placeholder="City name"
                  autoComplete="address-level2"
                />
                {errors.townCity && <p className={errorClass}>{errors.townCity}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="streetAddress" className={labelClass}>
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="streetAddress"
                  type="text"
                  value={form.streetAddress}
                  onChange={(e) => updateField("streetAddress", e.target.value)}
                  className={inputClass}
                  placeholder="House no., street, locality"
                  autoComplete="street-address"
                />
                {errors.streetAddress && (
                  <p className={errorClass}>{errors.streetAddress}</p>
                )}
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={inputClass}
                  autoComplete="address-level1"
                >
                  <option value="">Select state</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && <p className={errorClass}>{errors.state}</p>}
              </div>
              <div>
                <label htmlFor="pincode" className={labelClass}>
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  id="pincode"
                  type="text"
                  value={form.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  className={inputClass}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  autoComplete="postal-code"
                />
                {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-5">
            <div>
              <label htmlFor="orderNotes" className={labelClass}>
                Order Notes
              </label>
              <textarea
                id="orderNotes"
                rows={3}
                value={form.orderNotes}
                onChange={(e) => updateField("orderNotes", e.target.value)}
                className={inputClass}
                placeholder="Any specific preferences for your order..."
              />
            </div>
            <div>
              <label htmlFor="specialRequests" className={labelClass}>
                Special Requests <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                id="specialRequests"
                rows={3}
                value={form.specialRequests}
                onChange={(e) => updateField("specialRequests", e.target.value)}
                className={inputClass}
                placeholder="Custom design requests, fabric preferences, etc."
              />
            </div>
          </div>

          <label className="mb-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.createAccount}
              onChange={(e) => updateField("createAccount", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-ivory-dark text-maroon focus:ring-maroon/20"
            />
            <span className="text-sm text-text-muted">
              Create an account for faster checkout and order tracking
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-maroon py-4 text-sm font-semibold text-white transition-all hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
          >
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>
        </form>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
          <a
            href="https://www.instagram.com/_renuka_fabric_.art_"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-maroon transition-colors hover:text-maroon-dark"
          >
            Instagram: @_renuka_fabric_.art_
          </a>
          <a
            href="https://www.facebook.com/search/top?q=Renuka%27s%20Art"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-maroon transition-colors hover:text-maroon-dark"
          >
            Facebook: Renuka&apos;s Art
          </a>
          <a
            href="https://wa.me/918445944019"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-maroon transition-colors hover:text-maroon-dark"
          >
            WhatsApp: +91 8445944019
          </a>
        </div>
      </div>

      {successMessage && (
        <SuccessToast
          message={
            bookingDetails
              ? `${successMessage}\n\n${bookingDetails}`
              : successMessage
          }
          onClose={() => {
            setSuccessMessage(null);
            setBookingDetails(null);
          }}
          duration={6000}
        />
      )}
    </section>
  );
}
