import { isSupabaseConfigured, supabase } from "./supabase.js";

const IMAGE_BUCKET = "product-images";
const VIDEO_BUCKET = "product-videos";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

function normalizeSpecs(specs) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
    return {};
  }
  return specs;
}

function normalizeFeatures(features) {
  return Array.isArray(features) ? features.filter(Boolean) : [];
}

export function normalizeProduct(row, images = []) {
  const cover = row.cover_url || images[0]?.image_url || "";
  return {
    ...row,
    cover_url: cover,
    specs: normalizeSpecs(row.specs),
    features: normalizeFeatures(row.features),
    images: images.map((image) => image.image_url),
  };
}

export async function getSession() {
  requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function signIn(email, password) {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  return data;
}

export async function signOut() {
  requireSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function fetchProducts({ activeOnly = false } = {}) {
  requireSupabase();
  let query = supabase.from("products").select("*").order("sort_order", { ascending: true });
  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data || []).map((product) => normalizeProduct(product));
}

export async function fetchProductImages(productId) {
  requireSupabase();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }
  return data || [];
}

export async function fetchAllProductImages() {
  requireSupabase();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data || [];
}

export async function fetchProductById(id) {
  requireSupabase();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const images = await fetchProductImages(data.id);
  return normalizeProduct(data, images);
}

export async function fetchProductByModel(model) {
  requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("model", model)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const images = await fetchProductImages(data.id);
  return normalizeProduct(data, images);
}

export async function createProduct(payload) {
  requireSupabase();
  const { data, error } = await supabase.from("products").insert(payload).select("*").single();
  if (error) {
    throw error;
  }
  return normalizeProduct(data);
}

export async function updateProduct(id, payload) {
  requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return normalizeProduct(data);
}

export async function deleteProduct(id) {
  requireSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function addProductImage(productId, imageUrl, sortOrder = 0) {
  requireSupabase();
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_url: imageUrl, sort_order: sortOrder })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function deleteProductImage(id) {
  requireSupabase();
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function updateProductImage(id, payload) {
  requireSupabase();
  const { data, error } = await supabase
    .from("product_images")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

function storagePath(file, folder) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExt = String(ext).replace(/[^a-zA-Z0-9]/g, "") || "bin";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
}

async function uploadToBucket(bucket, file, folder) {
  requireSupabase();
  const path = storagePath(file, folder);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function uploadProductImage(file, folder = "products") {
  return uploadToBucket(IMAGE_BUCKET, file, folder);
}

export function uploadProductVideo(file, folder = "videos") {
  return uploadToBucket(VIDEO_BUCKET, file, folder);
}

export async function fetchSiteSettings() {
  requireSupabase();
  const { data, error } = await supabase.from("site_settings").select("*");
  if (error) {
    throw error;
  }

  return (data || []).reduce((settings, item) => {
    settings[item.key] = item.value;
    return settings;
  }, {});
}

export async function upsertSiteSetting(key, value) {
  requireSupabase();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}
