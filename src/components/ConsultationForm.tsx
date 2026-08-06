"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { Calendar, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { supabase } from "@/lib/supabaseClient";
import { consultationTimeSlots } from "@/data/indian-states";
import { validateEmail, validatePhone } from "@/lib/validation";
import { SuccessToast } from "@/components/SuccessToast";

interface ConsultationFormFields {
  fullName: string;
  email: string;
  phone: string;
  consultationDate: string;
  consultationTime: string;
  specialRequests: string;
}

const initialForm: ConsultationFormFields = {
  fullName: "",
  email: "",
  phone: "",
  consultationDate: "",
  consultationTime: "",
  specialRequests: "",
};

export function ConsultationForm() {
  const { user, isAuthenticated } = useAuth();
  const { openAuth } = useAuthModal();
  const [form, setForm] = useState<ConsultationFormFields>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBookedSlots = useCallback(async () => {
    const { data, error } = await supabase
      .from("consultations")
      .select("consultation_date, consultation_time");

    if (error) {
      console.error("Failed to fetch booked slots:", error.message);
      return;
    }

    setBookedSlots(
      new Set(
        (data ?? []).map(
          (row) => `${row.consultation_date}-${row.consultation_time}`
        )
      )
    );
  }, []);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setForm((prev) => ({ ...prev, fullName: user.name, email: user.email }));
    }
  }

  const updateField = <K extends keyof ConsultationFormFields>(
    field: K,
    value: ConsultationFormFields[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "consultationDate" || field === "consultationTime") {
      setIsRequestSubmitted(false);
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const isSlotBooked = (date: string, time: string) =>
    bookedSlots.has(`${date}-${time}`);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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
    if (!form.consultationDate)
      newErrors.consultationDate = "Please select a consultation date";
    if (!form.consultationTime)
      newErrors.consultationTime = "Please select a time slot";
    else if (isSlotBooked(form.consultationDate, form.consultationTime)) {
      newErrors.consultationTime =
        "This time slot is already booked. Please choose another.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      openAuth("login");
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setErrors((prev) => ({ ...prev, form: "You must be logged in to book a consultation." }));
      setIsSubmitting(false);
      openAuth("login");
      return;
    }

    const { error } = await supabase.from("consultations").insert({
      user_id: userId,
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      consultation_date: form.consultationDate,
      consultation_time: form.consultationTime,
      special_requests: form.specialRequests || null,
    });

    if (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Failed to book consultation: ${error.message}`,
      }));
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(
      "Your consultation request has been submitted! We'll contact you shortly to confirm the details."
    );
    setIsRequestSubmitted(true);
    setIsSubmitting(false);
    await fetchBookedSlots();

    setForm({
      ...initialForm,
      fullName: user?.name || "",
      email: user?.email || "",
    });
  };

  const inputClass =
    "w-full rounded-xl border border-ivory-dark bg-ivory px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted/60 focus:border-maroon focus:ring-2 focus:ring-maroon/10";
  const labelClass = "mb-1.5 block text-sm font-medium text-text-primary";
  const errorClass = "mt-1 text-xs text-red-500";
  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="consultation" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Get in Touch
          </p>
          <h2 className="section-heading mb-4 text-3xl font-bold text-maroon sm:text-4xl">
            Book a Consultation
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Pick a date and time and share your details. Our team will reach
            out to confirm your consultation.
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

          <button
            type="submit"
            disabled={isSubmitting || isRequestSubmitted}
            className="w-full rounded-xl bg-maroon py-4 text-sm font-semibold text-white transition-all hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
          >
            {isSubmitting
              ? "Processing..."
              : isRequestSubmitted
                ? "✓ Request Submitted"
                : "Book Consultation"}
          </button>
        </form>
      </div>

      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          duration={6000}
        />
      )}
    </section>
  );
}
