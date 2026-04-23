import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
	const url = process.env.SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios");
	}

	return createClient(url, serviceKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
}

export function getSupabaseBucketName() {
	return process.env.SUPABASE_STORAGE_BUCKET || "avatars";
}
