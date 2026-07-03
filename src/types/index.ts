export interface Product {
  id: string;
  image: string;
  description?: string;
  price?: string;
  name?: string;
  sku?: string;
  stock?: number;
  is_featured?: boolean;
  is_available?: boolean;
  tags?: string[];
  created_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
}

export interface CartItem {
  productId: string;
  image: string;
  quantity: number;
}

export interface User {
  name: string;
  email: string;
  role?: "admin" | "user";
}

export interface ConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  streetAddress: string;
  townCity: string;
  state: string;
  pincode: string;
  createAccount: boolean;
  orderNotes: string;
  specialRequests: string;
  consultationDate: string;
  consultationTime: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface DbOrder {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  ordered_sarees: string;
  quantity: number;
  total_price: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export interface DbInquiry {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  saree_interested_in?: string;
  message: string;
  is_responded: boolean;
  created_at: string;
}

export interface DbConsultation {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  street_address: string;
  town_city: string;
  state: string;
  pincode: string;
  order_notes: string | null;
  special_requests: string | null;
  consultation_date: string;
  consultation_time: string;
  created_at: string;
}
