import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET;
const supabaseContentTable = import.meta.env.VITE_SUPABASE_CONTENT_TABLE || "site_content";

export const cloudEnabled = Boolean(supabaseUrl && supabaseAnonKey && supabaseBucket);

const supabase = cloudEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function cloudSignIn(email, password) {
  if (!supabase) {
    throw new Error("Cloud auth is not configured.");
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  return data;
}

export async function cloudSignOut() {
  if (!supabase) {
    return;
  }
  await supabase.auth.signOut();
}

export async function getCloudSession() {
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchSiteContent() {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from(supabaseContentTable)
    .select("content")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.content ?? null;
}

export async function saveSiteContent(content) {
  if (!supabase) {
    throw new Error("Cloud data storage is not configured.");
  }
  const { error } = await supabase.from(supabaseContentTable).upsert(
    {
      id: "default",
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function uploadMediaToCloud(files, folder = "products") {
  if (!supabase) {
    throw new Error("Cloud storage is not configured.");
  }

  const results = [];

  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(supabaseBucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(path);
    results.push(data.publicUrl);
  }

  return results;
}

export async function uploadImagesToCloud(files) {
  return uploadMediaToCloud(files, "images");
}

export async function uploadVideosToCloud(files) {
  return uploadMediaToCloud(files, "videos");
}
