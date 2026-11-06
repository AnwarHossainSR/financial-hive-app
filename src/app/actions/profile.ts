"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: {
  displayName?: string;
  avatarUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // 1. Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
      },
    });

    if (authError) throw authError;

    // 2. Update Prisma profile
    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        email: user.email!,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
      },
    });

    revalidatePath("/profile");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function ensureProfileExistsAction(userData: {
  id?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}) {
  try {
    // id and email come from the verified session, not the client payload
    const user = await requireUser();
    const email = user.email;
    const displayName =
      userData.display_name || email?.split("@")[0] || "User";

    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {
        email,
        display_name: displayName,
        avatar_url: userData.avatar_url,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        email: email || "",
        display_name: displayName,
        avatar_url: userData.avatar_url,
      },
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error in ensureProfileExistsAction:", error);
    return { success: false, error: error.message };
  }
}
