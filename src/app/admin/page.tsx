"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Package,
  Mail,
  Calendar,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Edit,
  Trash2,
  Download,
  Check,
  X,
  Loader,
  AlertCircle,
  Upload,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Product, DbOrder, DbInquiry, DbConsultation } from "@/types";

type TabType = "products" | "orders" | "inquiries" | "consultations";

interface Toast {
  message: string;
  type: "success" | "error" | "info";
  id: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // Database Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [inquiries, setInquiries] = useState<DbInquiry[]>([]);
  const [consultations, setConsultations] = useState<DbConsultation[]>([]);

  // Loading & Error States
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState("created_at");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Action States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string | number;
    type: "product" | "order" | "inquiry" | "consultation";
  } | null>(null);

  // Form States for Add/Edit Saree
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: 5,
    image: "",
    is_featured: false,
    is_available: true,
    tagsString: "handpainted, silk",
    useUrl: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Check auth and redirect if not admin
  const isAuthorizedAdmin = useMemo(() => {
    return user?.role === "admin";
  }, [user]);

  // Fetch Database Data
  const fetchData = async () => {
    if (!isAuthorizedAdmin) return;
    setDbLoading(true);
    setDbError(null);
    try {
      // 1. Fetch Products
      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      // Note: If schema is not run yet, let's capture the table-not-found gracefully to guide the admin.
      if (prodErr && prodErr.code !== "PGRST116" && !prodErr.message.includes("does not exist")) {
        throw prodErr;
      }
      setProducts(prodData || []);

      // 2. Fetch Orders
      const { data: ordData, error: ordErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (ordErr && !ordErr.message.includes("does not exist")) throw ordErr;
      setOrders(ordData || []);

      // 3. Fetch Inquiries
      const { data: inqData, error: inqErr } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (inqErr && !inqErr.message.includes("does not exist")) throw inqErr;
      setInquiries(inqData || []);

      // 4. Fetch Consultations (Existing frontend writes here)
      const { data: consData, error: consErr } = await supabase
        .from("consultations")
        .select("*")
        .order("consultation_date", { ascending: false });
      if (consErr && !consErr.message.includes("does not exist")) throw consErr;
      setConsultations(consData || []);

      // If tables don't exist, we show a helpful warning banner
      if (prodErr?.message.includes("does not exist")) {
        setDbError("Supabase database tables are not yet set up. Please run the SQL schema from schema.sql in your Supabase SQL editor to enable database storage.");
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      addToast(error.message || "Failed to load database records", "error");
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, isAuthorizedAdmin]);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  // CSV Export utility
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      addToast("No data available to export", "info");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName];
            const cleanVal = val === null || val === undefined ? "" : String(val).replace(/"/g, '""');
            return cleanVal.includes(",") || cleanVal.includes("\n") || cleanVal.includes('"')
              ? `"${cleanVal}"`
              : cleanVal;
          })
          .join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported to CSV successfully!", "success");
  };

  // Seeding functions
  const handleSeedStorefrontData = async () => {
    setDbLoading(true);
    try {
      // 1. Seed 13 Saree Products
      const sampleProducts = Array.from({ length: 13 }, (_, i) => {
        const num = String(i + 1).padStart(2, "0");
        return {
          name: `Handpainted Masterpiece Saree ${num}`,
          sku: `SAREE-HP-${num}`,
          description: `A premium wearable art saree handpainted with floral elements, rich traditional patterns and delicate brushstrokes. Exquisite craftsmanship by local artisans on selected heritage silk.`,
          price: `Rs. ${(15000 + i * 2000).toLocaleString("en-IN")}`,
          stock: i === 5 ? 0 : 5, // make one out of stock
          image: `/images/products/product-${num}.jpeg`,
          is_featured: i < 3,
          is_available: true,
          tags: ["handpainted", "silk", "wearable-art", "premium"]
        };
      });

      const { error: pErr } = await supabase.from("products").insert(sampleProducts);
      if (pErr) throw pErr;

      // 2. Seed Sample Orders
      const sampleOrders = [
        {
          customer_name: "Aishwarya Rai",
          email: "aishwarya@example.com",
          phone: "+91 98200 12345",
          shipping_address: "Prateeksha, Juhu, Mumbai, Maharashtra - 400049",
          ordered_sarees: "Handpainted Masterpiece Saree 01",
          quantity: 1,
          total_price: "Rs. 15,000",
          payment_status: "Paid",
          order_status: "Delivered"
        },
        {
          customer_name: "Priyanka Chopra",
          email: "priyanka.cop@example.com",
          phone: "+91 98111 54321",
          shipping_address: "Yari Road, Versova, Andheri West, Mumbai, Maharashtra - 400061",
          ordered_sarees: "Handpainted Masterpiece Saree 02, Handpainted Masterpiece Saree 04",
          quantity: 2,
          total_price: "Rs. 38,000",
          payment_status: "Paid",
          order_status: "Shipped"
        },
        {
          customer_name: "Deepika Padukone",
          email: "deepika.p@example.com",
          phone: "+91 99300 98765",
          shipping_address: "BeauMonde Towers, Prabhadevi, Mumbai, Maharashtra - 400025",
          ordered_sarees: "Handpainted Masterpiece Saree 03",
          quantity: 1,
          total_price: "Rs. 19,000",
          payment_status: "Pending",
          order_status: "Confirmed"
        }
      ];
      const { error: oErr } = await supabase.from("orders").insert(sampleOrders);
      if (oErr) throw oErr;

      // 3. Seed Sample Inquiries
      const sampleInquiries = [
        {
          customer_name: "Meera Nair",
          email: "meera.nair@example.com",
          phone: "+91 98450 98765",
          saree_interested_in: "Handpainted Masterpiece Saree 04",
          message: "Hello Renuka, I love Saree 04. Can we get this custom-painted on a Tussar silk base instead of Organza? How long would the painting take?",
          is_responded: false
        },
        {
          customer_name: "Aditi Rao",
          email: "aditi.r@example.com",
          phone: "+91 91770 12345",
          saree_interested_in: "Handpainted Masterpiece Saree 07",
          message: "Greetings! I would like to order Saree 07 for a family wedding in the US. Do you provide international shipping?",
          is_responded: true
        }
      ];
      const { error: iErr } = await supabase.from("inquiries").insert(sampleInquiries);
      if (iErr) throw iErr;

      addToast("Successfully seeded database with premium sample records!", "success");
      fetchData();
    } catch (err: any) {
      console.error("Seeding error:", err);
      addToast(err.message || "Failed to seed sample data", "error");
    } finally {
      setDbLoading(false);
    }
  };

  // Image Upload Logic (Supabase Storage)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "saree-images";
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const isStorageConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (isStorageConfigured) {
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
          setProductForm((prev) => ({ ...prev, image: data.publicUrl }));
          addToast("Saree image uploaded successfully!", "success");
          return;
        }

        console.warn("Supabase storage upload unavailable, using a local data URL instead:", uploadError);
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read the selected image."));
        reader.readAsDataURL(file);
      });

      setProductForm((prev) => ({ ...prev, image: dataUrl }));
      addToast(
        "Supabase storage is not available for this project, so the image was embedded locally for this product. Save the product to keep it.",
        "info"
      );
    } catch (err: any) {
      console.error("Image upload failed:", err);
      addToast(
        `Image upload failed: ${err.message}. You can still paste a local image path like /images/products/product-01.jpeg instead.`,
        "error"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Add Product Form submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.image) {
      addToast("Please fill in Saree Name, SKU, Price, and Image URL/File", "error");
      return;
    }

    try {
      const tags = productForm.tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error } = await supabase.from("products").insert({
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        price: productForm.price,
        stock: Number(productForm.stock),
        image: productForm.image,
        is_featured: productForm.is_featured,
        is_available: Number(productForm.stock) > 0,
        tags
      });

      if (error) throw error;

      addToast(`Saree "${productForm.name}" added successfully!`, "success");
      setIsAddProductOpen(false);
      // Reset Form
      setProductForm({
        name: "",
        sku: "",
        description: "",
        price: "",
        stock: 5,
        image: "",
        is_featured: false,
        is_available: true,
        tagsString: "handpainted, silk",
        useUrl: true
      });
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to add saree", "error");
    }
  };

  // Edit Product Form submit
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const tags = productForm.tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error } = await supabase
        .from("products")
        .update({
          name: productForm.name,
          sku: productForm.sku,
          description: productForm.description,
          price: productForm.price,
          stock: Number(productForm.stock),
          image: productForm.image,
          is_featured: productForm.is_featured,
          is_available: Number(productForm.stock) > 0,
          tags
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      addToast(`Saree "${productForm.name}" updated successfully!`, "success");
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to update product", "error");
    }
  };

  // Open Edit Product Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock !== undefined ? product.stock : 5,
      image: product.image || "",
      is_featured: !!product.is_featured,
      is_available: !!product.is_available,
      tagsString: product.tags ? product.tags.join(", ") : "handpainted, silk",
      useUrl: true
    });
  };

  // Update order status/payment status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);

      if (error) throw error;
      addToast("Order status updated successfully!", "success");
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to update status", "error");
    }
  };

  const handleUpdateOrderPayment = async (orderId: string, payment: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: payment })
        .eq("id", orderId);

      if (error) throw error;
      addToast("Order payment status updated!", "success");
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to update payment status", "error");
    }
  };

  // Toggle Inquiry response state
  const handleToggleInquiryResponded = async (inqId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ is_responded: !current })
        .eq("id", inqId);

      if (error) throw error;
      addToast(!current ? "Inquiry marked as responded!" : "Inquiry marked as unresponded", "success");
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to update inquiry", "error");
    }
  };

  // Delete Record Execution
  const handleDeleteRecord = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;

    try {
      let table = "";
      if (type === "product") table = "products";
      else if (type === "order") table = "orders";
      else if (type === "inquiry") table = "inquiries";
      else if (type === "consultation") table = "consultations";

      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;

      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} record deleted successfully`, "success");
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to delete item", "error");
    }
  };

  // Toggle Featured status inline for product list
  const handleToggleProductFeatured = async (prodId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: !current })
        .eq("id", prodId);

      if (error) throw error;
      addToast(!current ? "Saree marked as Featured!" : "Saree removed from Featured", "success");
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Failed to toggle featured status", "error");
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    await logout();
    addToast("Logged out successfully", "info");
    router.push("/");
  };

  // Statistics
  const statistics = useMemo(() => {
    const totalP = products.length;
    const totalO = orders.length;
    const pendingO = orders.filter((o) => o.order_status === "Pending").length;
    const outOfStock = products.filter((p) => (p.stock !== undefined ? p.stock === 0 : false)).length;
    const openInquiries = inquiries.filter((i) => !i.is_responded).length;
    const totalConsultations = consultations.length;

    return { totalP, totalO, pendingO, outOfStock, openInquiries, totalConsultations };
  }, [products, orders, inquiries, consultations]);

  // Filtering, Sorting, Searching Logic
  const processedData = useMemo(() => {
    let list: any[] = [];
    if (activeTab === "products") list = [...products];
    else if (activeTab === "orders") list = [...orders];
    else if (activeTab === "inquiries") list = [...inquiries];
    else if (activeTab === "consultations") list = [...consultations];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        if (activeTab === "products") {
          return (
            item.name?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
          );
        } else if (activeTab === "orders") {
          return (
            item.customer_name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.id?.toLowerCase().includes(q)
          );
        } else if (activeTab === "inquiries") {
          return (
            item.customer_name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.message?.toLowerCase().includes(q) ||
            item.saree_interested_in?.toLowerCase().includes(q)
          );
        } else if (activeTab === "consultations") {
          return (
            item.full_name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.street_address?.toLowerCase().includes(q) ||
            item.town_city?.toLowerCase().includes(q)
          );
        }
        return false;
      });
    }

    // Status Filter
    if (statusFilter !== "All") {
      list = list.filter((item) => {
        if (activeTab === "products") {
          if (statusFilter === "Featured") return item.is_featured;
          if (statusFilter === "Available") return item.stock > 0;
          if (statusFilter === "Out of Stock") return item.stock === 0;
        } else if (activeTab === "orders") {
          return item.order_status === statusFilter;
        } else if (activeTab === "inquiries") {
          if (statusFilter === "Responded") return item.is_responded;
          if (statusFilter === "Pending") return !item.is_responded;
        }
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];

      // Handle undefined fields
      if (fieldA === undefined || fieldA === null) fieldA = "";
      if (fieldB === undefined || fieldB === null) fieldB = "";

      if (typeof fieldA === "string") {
        return sortDirection === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      } else {
        return sortDirection === "asc"
          ? (fieldA as number) - (fieldB as number)
          : (fieldB as number) - (fieldA as number);
      }
    });

    return list;
  }, [activeTab, products, orders, inquiries, consultations, searchQuery, statusFilter, sortField, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Auth Loading Phase
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory text-maroon">
        <Loader className="h-10 w-10 animate-spin text-maroon" />
        <p className="mt-4 font-serif text-lg tracking-wide animate-pulse">
          Securing Admin Connection...
        </p>
      </div>
    );
  }

  // Access Denied Screen (Option 1 & Option 2)
  if (!isAuthorizedAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center text-text-primary">
        <div className="max-w-md rounded-2xl border border-ivory-dark bg-white p-8 shadow-card transition-all duration-300 hover:scale-[1.01]">
          <AlertCircle className="mx-auto h-16 w-16 text-maroon" />
          <h2 className="section-heading mt-6 text-2xl font-bold text-maroon sm:text-3xl">
            Access Denied
          </h2>
          <p className="mt-4 text-text-muted">
            The administrative dashboard at <code className="rounded bg-ivory px-1.5 py-0.5 text-maroon font-semibold">/admin</code> is restricted to authorized email accounts.
          </p>
          <div className="mt-4 text-left rounded-lg bg-ivory/50 border border-ivory-dark p-3 text-xs text-text-muted/80">
            <span className="font-semibold text-text-primary block mb-1">Approved Admins:</span>
            • nutansingh603@gmail.com<br />
            • singhrenuka412@gmail.com
          </div>
          {user ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-text-muted">
                Logged in as: <strong className="text-text-primary">{user.email}</strong>
              </p>
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-maroon py-3 text-sm font-semibold text-white transition-all hover:bg-maroon-dark"
              >
                Log Out & Switch User
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="mt-6 block w-full rounded-xl border-2 border-maroon bg-white py-3 text-sm font-semibold text-maroon transition-all hover:bg-maroon/5"
            >
              Return to Storefront
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory font-sans text-text-primary pb-16">
      {/* Toast notifications */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 shadow-card animate-scale-in text-sm ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {toast.type === "success" && <Check className="h-5 w-5 text-green-600" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span className="font-medium whitespace-pre-wrap">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Admin Nav */}
      <header className="sticky top-0 z-30 border-b border-ivory-dark bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-maroon text-white font-bold">R</span>
            <div>
              <h1 className="font-serif text-lg font-bold text-maroon sm:text-xl">Renuka&apos;s Art</h1>
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Admin Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-text-primary">{user?.name}</p>
              <p className="text-[10px] text-text-muted">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-ivory-dark bg-white px-3.5 py-2 text-xs font-semibold text-text-primary shadow-soft transition-all hover:border-maroon/20 hover:text-maroon"
            >
              <LogOut className="h-3.5 w-3.5 text-maroon" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        
        {/* SQL schema helper banner */}
        {dbError && (
          <div className="mb-8 rounded-2xl border border-gold/30 bg-gold/5 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-maroon" />
              <div>
                <h3 className="font-serif font-bold text-maroon">Database Tables Missing</h3>
                <p className="mt-1 text-sm text-text-muted leading-relaxed">
                  The dashboard queries Supabase for products, orders, and inquiries. Please copy the SQL from your local file <code className="rounded bg-white border border-ivory-dark px-1.5 py-0.5 text-maroon font-mono text-xs font-semibold">schema.sql</code> and execute it in your Supabase SQL Editor.
                </p>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Schema copied to clipboard!"); 
                      addToast("Schema script path noted. Please read schema.sql file content to copy.", "info");
                    }}
                    className="rounded-lg bg-maroon px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-maroon-dark"
                  >
                    SQL File: schema.sql
                  </button>
                  <button
                    onClick={fetchData}
                    className="rounded-lg border border-maroon/20 bg-white px-4 py-2 text-xs font-semibold text-maroon transition-all hover:bg-maroon/5"
                  >
                    Retry Database Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Statistics Cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-ivory-dark bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Sarees</span>
              <Package className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-2 text-3xl font-bold text-maroon">{dbLoading ? "..." : statistics.totalP}</p>
            <p className="text-[10px] text-text-muted mt-1">In public catalog</p>
          </div>

          <div className="rounded-2xl border border-ivory-dark bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Orders</span>
              <ShoppingBag className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-2 text-3xl font-bold text-maroon">{dbLoading ? "..." : statistics.totalO}</p>
            <p className="text-[10px] text-text-muted mt-1">Customers shopping online</p>
          </div>

          <div className="rounded-2xl border border-ivory-dark bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending Orders</span>
              <AlertCircle className="h-5 w-5 text-maroon" />
            </div>
            <p className="mt-2 text-3xl font-bold text-maroon">{dbLoading ? "..." : statistics.pendingO}</p>
            <p className="text-[10px] text-text-muted mt-1">Requires confirmation</p>
          </div>

          <div className="rounded-2xl border border-ivory-dark bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Out of Stock</span>
              <X className="h-5 w-5 text-red-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-maroon">{dbLoading ? "..." : statistics.outOfStock}</p>
            <p className="text-[10px] text-text-muted mt-1">Needs stock reload</p>
          </div>

          <div className="rounded-2xl border border-ivory-dark bg-white p-5 shadow-soft col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Inquiries / Bookings</span>
              <Mail className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-2 text-3xl font-bold text-maroon">{dbLoading ? "..." : statistics.openInquiries + statistics.totalConsultations}</p>
            <p className="text-[10px] text-text-muted mt-1">{statistics.openInquiries} inquiries | {statistics.totalConsultations} consultations</p>
          </div>
        </section>

        {/* Actions bar */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Tab Selection */}
          <div className="flex rounded-xl border border-ivory-dark bg-white p-1 shadow-soft">
            <button
              onClick={() => { setActiveTab("products"); setStatusFilter("All"); }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "products"
                  ? "bg-maroon text-white shadow-sm"
                  : "text-text-muted hover:text-maroon"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Sarees ({products.length})
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setStatusFilter("All"); }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-maroon text-white shadow-sm"
                  : "text-text-muted hover:text-maroon"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab("inquiries"); setStatusFilter("All"); }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "inquiries"
                  ? "bg-maroon text-white shadow-sm"
                  : "text-text-muted hover:text-maroon"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Inquiries ({inquiries.length})
            </button>
            <button
              onClick={() => { setActiveTab("consultations"); setStatusFilter("All"); }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "consultations"
                  ? "bg-maroon text-white shadow-sm"
                  : "text-text-muted hover:text-maroon"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Storefront Bookings ({consultations.length})
            </button>
          </div>

          {/* Action buttons (Add Saree, Seed Data, CSV export) */}
          <div className="flex flex-wrap items-center gap-3">
            {products.length === 0 && !dbLoading && !dbError && (
              <button
                onClick={handleSeedStorefrontData}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-gold bg-gold/10 px-4 py-2.5 text-xs font-semibold text-maroon shadow-soft transition-all hover:bg-gold/20"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold animate-bounce" />
                Seed Sample Records
              </button>
            )}

            {activeTab === "products" && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-maroon px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-maroon-dark"
              >
                <Plus className="h-4 w-4" />
                Add New Saree
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === "products") exportToCSV(products, "Saree_Inventory");
                else if (activeTab === "orders") exportToCSV(orders, "Customer_Orders");
                else if (activeTab === "inquiries") exportToCSV(inquiries, "Customer_Inquiries");
                else if (activeTab === "consultations") exportToCSV(consultations, "Consultations_Data");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-ivory-dark bg-white px-4 py-2.5 text-xs font-semibold text-text-primary shadow-soft transition-all hover:border-maroon/20 hover:text-maroon"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </section>

        {/* Search and Filters Section */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative rounded-xl border border-ivory-dark bg-white shadow-soft">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={
                activeTab === "products"
                  ? "Search by saree name, SKU..."
                  : activeTab === "orders"
                  ? "Search by customer name, email, order ID..."
                  : activeTab === "inquiries"
                  ? "Search by customer, email, message..."
                  : "Search booking name, town..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-transparent py-3 pl-10 pr-4 text-xs text-text-primary outline-none placeholder:text-text-muted/60"
            />
          </div>

          <div className="relative rounded-xl border border-ivory-dark bg-white shadow-soft">
            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl bg-transparent py-3 pl-10 pr-10 text-xs text-text-primary outline-none"
            >
              <option value="All">All Statuses / Categories</option>
              {activeTab === "products" && (
                <>
                  <option value="Available">In Stock / Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Featured">Featured Sarees</option>
                </>
              )}
              {activeTab === "orders" && (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
              {activeTab === "inquiries" && (
                <>
                  <option value="Pending">Unresponded Inquiries</option>
                  <option value="Responded">Responded Inquiries</option>
                </>
              )}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-l border-ivory-dark pl-2 text-text-muted">
              ▼
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-ivory-dark bg-white px-4 py-2.5 shadow-soft">
            <span className="text-xs text-text-muted">
              Showing <strong className="text-maroon">{processedData.length}</strong> records
            </span>
            <button
              onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="flex items-center gap-1 text-xs font-semibold text-maroon hover:text-maroon-dark"
            >
              <ArrowUpDown className="h-3 w-3" />
              Sort: {sortDirection === "asc" ? "Oldest / Asc" : "Newest / Desc"}
            </button>
          </div>
        </section>

        {/* Database Content Area */}
        <section className="rounded-2xl border border-ivory-dark bg-white shadow-soft overflow-hidden">
          {dbLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-maroon">
              <Loader className="h-8 w-8 animate-spin text-maroon" />
              <p className="mt-4 font-serif text-sm tracking-wide">Syncing records with Supabase...</p>
            </div>
          ) : processedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-12 w-12 text-gold mb-4" />
              <h3 className="font-serif text-lg font-bold text-maroon">No Records Found</h3>
              <p className="mt-2 text-sm text-text-muted max-w-sm">
                We couldn&apos;t find any records matching your filters or database queries. Try clearing search filters or seed sample data.
              </p>
              {products.length === 0 && activeTab === "products" && (
                <button
                  onClick={handleSeedStorefrontData}
                  className="mt-6 rounded-xl bg-maroon px-5 py-3 text-xs font-semibold text-white shadow-soft transition-all hover:bg-maroon-dark"
                >
                  Load Mock Saree Inventory
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              
              {/* SAREES TABLE */}
              {activeTab === "products" && (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-ivory-dark bg-ivory/40 text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => toggleSort("name")}>Saree Name</th>
                      <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => toggleSort("sku")}>SKU / ID</th>
                      <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => toggleSort("price")}>Price</th>
                      <th className="px-6 py-4 font-semibold cursor-pointer text-center" onClick={() => toggleSort("stock")}>Stock</th>
                      <th className="px-6 py-4 font-semibold text-center">Featured</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => toggleSort("created_at")}>Added Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-dark text-xs">
                    {paginatedData.map((product: Product) => (
                      <tr key={product.id} className="hover:bg-ivory/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="relative h-12 w-9 overflow-hidden rounded border border-ivory-dark shadow-sm">
                            <Image
                              src={product.image && product.image.trim() !== "" ? product.image : "/images/products/product-01.jpeg"}
                              alt="Saree"
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={!!product.image && product.image.startsWith("http")}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-serif font-bold text-text-primary">{product.name || "Handpainted Saree"}</td>
                        <td className="px-6 py-3.5 font-mono text-text-muted">{product.sku || String(product.id).slice(0, 8)}</td>
                        <td className="px-6 py-3.5 font-semibold text-maroon">{product.price || "Contact for Price"}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            product.stock === 0 ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleProductFeatured(product.id, !!product.is_featured)}
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
                              product.is_featured
                                ? "bg-gold/10 border-gold text-maroon"
                                : "bg-gray-50 border-gray-200 text-text-muted hover:border-gold hover:text-maroon"
                            }`}
                          >
                            {product.is_featured ? "Featured ★" : "Make Featured"}
                          </button>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`flex items-center gap-1 font-semibold ${
                            product.stock && product.stock > 0 ? "text-green-700" : "text-red-500"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              product.stock && product.stock > 0 ? "bg-green-600" : "bg-red-500"
                            }`}></span>
                            {product.stock && product.stock > 0 ? "Available" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-text-muted">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString() : "Storefront Default"}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="rounded-lg border border-ivory-dark bg-white p-2 text-text-muted transition-all hover:border-maroon/20 hover:text-maroon shadow-soft"
                              title="Edit Product"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: product.id, type: "product" })}
                              className="rounded-lg border border-red-100 bg-white p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 shadow-soft"
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ORDERS TABLE */}
              {activeTab === "orders" && (
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-ivory-dark bg-ivory/40 text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold">Order ID</th>
                      <th className="px-6 py-4 font-semibold">Customer Details</th>
                      <th className="px-6 py-4 font-semibold">Shipping Address</th>
                      <th className="px-6 py-4 font-semibold">Ordered Saree(s)</th>
                      <th className="px-6 py-4 font-semibold text-center">Qty</th>
                      <th className="px-6 py-4 font-semibold">Total Price</th>
                      <th className="px-6 py-4 font-semibold">Payment</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Order Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-dark text-xs">
                    {paginatedData.map((order: DbOrder) => (
                      <tr key={order.id} className="hover:bg-ivory/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-text-muted">{String(order.id).slice(0, 8)}...</td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-text-primary">{order.customer_name}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{order.email}</p>
                          <p className="text-[10px] text-text-muted">{order.phone}</p>
                        </td>
                        <td className="px-6 py-3.5 text-text-muted max-w-[200px] truncate" title={order.shipping_address}>
                          {order.shipping_address}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-text-primary max-w-[150px] truncate" title={order.ordered_sarees}>
                          {order.ordered_sarees}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold">{order.quantity}</td>
                        <td className="px-6 py-3.5 font-semibold text-maroon">{order.total_price}</td>
                        <td className="px-6 py-3.5">
                          <select
                            value={order.payment_status}
                            onChange={(e) => handleUpdateOrderPayment(order.id, e.target.value)}
                            className={`rounded-lg border bg-white px-2 py-1 text-[10px] font-bold outline-none cursor-pointer ${
                              order.payment_status === "Paid"
                                ? "border-green-200 text-green-700 bg-green-50"
                                : "border-amber-200 text-amber-700 bg-amber-50"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </td>
                        <td className="px-6 py-3.5">
                          <select
                            value={order.order_status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`rounded-lg border bg-white px-2 py-1 text-[10px] font-semibold outline-none cursor-pointer ${
                              order.order_status === "Delivered"
                                ? "border-green-200 text-green-700 bg-green-50"
                                : order.order_status === "Cancelled"
                                ? "border-red-200 text-red-700 bg-red-50"
                                : order.order_status === "Shipped"
                                ? "border-blue-200 text-blue-700 bg-blue-50"
                                : "border-amber-200 text-amber-700 bg-amber-50"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-3.5 text-text-muted">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteConfirm({ id: order.id, type: "order" })}
                            className="rounded-lg border border-red-100 bg-white p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 shadow-soft"
                            title="Delete Order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* INQUIRIES TABLE */}
              {activeTab === "inquiries" && (
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-ivory-dark bg-ivory/40 text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold">Customer Details</th>
                      <th className="px-6 py-4 font-semibold">Saree Interest</th>
                      <th className="px-6 py-4 font-semibold">Message</th>
                      <th className="px-6 py-4 font-semibold text-center">Response Status</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-dark text-xs">
                    {paginatedData.map((inq: DbInquiry) => (
                      <tr key={inq.id} className="hover:bg-ivory/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-text-primary">{inq.customer_name}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{inq.email}</p>
                          <p className="text-[10px] text-text-muted">{inq.phone}</p>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-maroon max-w-[150px] truncate" title={inq.saree_interested_in || "General Inquiry"}>
                          {inq.saree_interested_in || "General Inquiry"}
                        </td>
                        <td className="px-6 py-3.5 text-text-muted max-w-[300px] whitespace-pre-wrap leading-relaxed">
                          {inq.message}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleInquiryResponded(inq.id, inq.is_responded)}
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
                              inq.is_responded
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                            }`}
                          >
                            {inq.is_responded ? "Responded ✓" : "Mark Responded"}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-text-muted">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteConfirm({ id: inq.id, type: "inquiry" })}
                            className="rounded-lg border border-red-100 bg-white p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 shadow-soft"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* CONSULTATIONS TABLE (STOREFRONT BOOKINGS) */}
              {activeTab === "consultations" && (
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-ivory-dark bg-ivory/40 text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold">Client Name</th>
                      <th className="px-6 py-4 font-semibold">Contact Info</th>
                      <th className="px-6 py-4 font-semibold">Consultation Slot</th>
                      <th className="px-6 py-4 font-semibold">Delivery Address</th>
                      <th className="px-6 py-4 font-semibold">Client Notes</th>
                      <th className="px-6 py-4 font-semibold">Special Requests</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-dark text-xs">
                    {paginatedData.map((consultation: DbConsultation) => (
                      <tr key={consultation.id} className="hover:bg-ivory/20 transition-colors">
                        <td className="px-6 py-3.5 font-serif font-bold text-text-primary">{consultation.full_name}</td>
                        <td className="px-6 py-3.5 text-text-muted">
                          <p>{consultation.email}</p>
                          <p className="mt-0.5">{consultation.phone}</p>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-maroon">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-maroon/5 px-2 py-0.5">{consultation.consultation_date}</span>
                            <span className="rounded bg-gold/10 px-2 py-0.5 text-text-primary">{consultation.consultation_time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-text-muted leading-relaxed">
                          {consultation.street_address}, {consultation.town_city}, {consultation.state} - {consultation.pincode} ({consultation.country})
                        </td>
                        <td className="px-6 py-3.5 text-text-muted italic max-w-[200px] truncate" title={consultation.order_notes || "None"}>
                          {consultation.order_notes || "—"}
                        </td>
                        <td className="px-6 py-3.5 text-text-muted max-w-[200px] truncate" title={consultation.special_requests || "None"}>
                          {consultation.special_requests || "—"}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteConfirm({ id: consultation.id, type: "consultation" })}
                            className="rounded-lg border border-red-100 bg-white p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 shadow-soft"
                            title="Delete Consultation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ivory-dark bg-ivory/10 px-6 py-4">
              <span className="text-xs text-text-muted">
                Page <strong className="text-text-primary">{currentPage}</strong> of <strong className="text-text-primary">{totalPages}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-lg border border-ivory-dark bg-white px-3.5 py-1.5 text-xs font-semibold text-text-primary shadow-soft transition-all hover:border-maroon/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-lg border border-ivory-dark bg-white px-3.5 py-1.5 text-xs font-semibold text-text-primary shadow-soft transition-all hover:border-maroon/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ADD / EDIT PRODUCT MODAL */}
      {(isAddProductOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-dark/25 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-ivory-dark bg-white p-6 shadow-card animate-scale-in sm:p-8 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
              className="absolute right-4 top-4 rounded-lg p-2 text-text-muted hover:bg-ivory hover:text-maroon"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="section-heading text-xl font-bold text-maroon sm:text-2xl mb-6">
              {editingProduct ? "Modify Saree Details" : "Introduce New Handpainted Saree"}
            </h3>

            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">Saree Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silk Lotus Masterpiece"
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">SKU / Product ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLK-LOT-01"
                    value={productForm.sku}
                    onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the paint techniques, artwork, fabric type..."
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">Price *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rs. 18,500"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary">Saree Image *</label>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-muted hover:text-maroon">
                      <input
                        type="radio"
                        checked={productForm.useUrl}
                        onChange={() => setProductForm((p) => ({ ...p, useUrl: true }))}
                        className="text-maroon focus:ring-maroon/10"
                      />
                      Image URL / Path
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-muted hover:text-maroon">
                      <input
                        type="radio"
                        checked={!productForm.useUrl}
                        onChange={() => setProductForm((p) => ({ ...p, useUrl: false }))}
                        className="text-maroon focus:ring-maroon/10"
                      />
                      Upload File
                    </label>
                  </div>
                </div>

                {productForm.useUrl ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. /images/products/product-01.jpeg or external https:// link"
                    value={productForm.image}
                    onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
                    className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                  />
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border border-dashed border-ivory-dark bg-ivory/10 p-4">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-maroon px-4 py-2.5 text-xs font-semibold text-white shadow-soft hover:bg-maroon-dark">
                      <Upload className="h-3.5 w-3.5" />
                      Choose Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <div className="flex-1 text-[10px] text-text-muted truncate">
                      {uploadingImage ? "Uploading file..." : productForm.image ? productForm.image : "No file uploaded yet"}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. handpainted, organza, floral, signature"
                  value={productForm.tagsString}
                  onChange={(e) => setProductForm((p) => ({ ...p, tagsString: e.target.value }))}
                  className="w-full rounded-xl border border-ivory-dark bg-ivory/30 px-4 py-3 text-xs text-text-primary outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 rounded-xl border border-ivory-dark p-4 bg-ivory/20">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-ivory-dark text-maroon focus:ring-maroon/10"
                  />
                  <span className="text-xs font-semibold text-text-primary">Mark Saree as Featured Collection</span>
                </label>
              </div>

              <div className="mt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 rounded-xl bg-maroon py-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-maroon-dark disabled:opacity-50"
                >
                  {editingProduct ? "Save Changes" : "Confirm Saree Release"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 rounded-xl border border-ivory-dark bg-white py-3.5 text-xs font-semibold text-text-primary transition-all hover:bg-ivory"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-dark/25 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-ivory-dark bg-white p-6 shadow-card animate-scale-in text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-maroon" />
            <h4 className="section-heading mt-4 text-lg font-bold text-maroon">Delete Confirmation</h4>
            <p className="mt-2 text-xs text-text-muted leading-relaxed">
              Are you sure you want to permanently delete this {deleteConfirm.type} from the database? This action is irreversible.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDeleteRecord}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-semibold text-white transition-all hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-ivory-dark bg-white py-3 text-xs font-semibold text-text-primary transition-all hover:bg-ivory"
              >
                No, Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
