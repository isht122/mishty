"use client";

import { useState, FormEvent } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { supabase } from "@/lib/supabaseClient";
import { indianStates } from "@/data/indian-states";
import { validatePincode } from "@/lib/validation";
import { SuccessToast } from "@/components/SuccessToast";

interface DeliveryAddressFields {
  fullName: string;
  phone: string;
  country: string;
  streetAddress: string;
  townCity: string;
  state: string;
  pincode: string;
  orderNotes: string;
}

const initialForm: DeliveryAddressFields = {
  fullName: "",
  phone: "",
  country: "India",
  streetAddress: "",
  townCity: "",
  state: "",
  pincode: "",
  orderNotes: "",
};

export function DeliveryAddressForm() {
  const { user, isAuthenticated } = useAuth();
  const { openAuth } = useAuthModal();
  const [form, setForm] = useState<DeliveryAddressFields>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setForm((prev) => ({ ...prev, fullName: user.name }));
    }
  }

  const updateField = <K extends keyof DeliveryAddressFields>(
    field: K,
    value: DeliveryAddressFields[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsSubmitted(false);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
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
      setErrors((prev) => ({ ...prev, form: "You must be logged in to save an address." }));
      setIsSubmitting(false);
      openAuth("login");
      return;
    }

    const { error } = await supabase.from("delivery_addresses").insert({
      user_id: userId,
      full_name: form.fullName,
      phone: form.phone,
      country: form.country,
      street_address: form.streetAddress,
      town_city: form.townCity,
      state: form.state,
      pincode: form.pincode,
      order_notes: form.orderNotes || null,
    });

    if (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Failed to save delivery address: ${error.message}`,
      }));
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Your delivery address has been saved successfully!");
    setIsSubmitted(true);
    setIsSubmitting(false);

    setForm({
      ...initialForm,
      fullName: user?.name || "",
    });
  };

  const inputClass =
    "w-full rounded-xl border border-ivory-dark bg-ivory px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted/60 focus:border-maroon focus:ring-2 focus:ring-maroon/10";
  const labelClass = "mb-1.5 block text-sm font-medium text-text-primary";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <section id="delivery-address" className="bg-ivory/40 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Save Your Details
          </p>
          <h2 className="section-heading mb-4 text-3xl font-bold text-maroon sm:text-4xl">
            Delivery Address
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Add your delivery address so we have it ready whenever you place
            an order.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-ivory-dark bg-white p-6 shadow-soft sm:p-10"
        >
          {errors.form && (
            <p className="mb-6 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {errors.form}
            </p>
          )}

          <div className="mb-8">
            <h3 className="section-heading mb-4 flex items-center gap-2 text-lg font-semibold text-maroon">
              <MapPin className="h-5 w-5" />
              Address Details
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

          <div className="mb-8">
            <label htmlFor="orderNotes" className={labelClass}>
              Order Notes <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="orderNotes"
              rows={3}
              value={form.orderNotes}
              onChange={(e) => updateField("orderNotes", e.target.value)}
              className={inputClass}
              placeholder="Any specific preferences for delivery..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="w-full rounded-xl bg-maroon py-4 text-sm font-semibold text-white transition-all hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
          >
            {isSubmitting
              ? "Saving..."
              : isSubmitted
                ? "✓ Address Saved"
                : "Save Delivery Address"}
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
