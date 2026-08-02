"use server";

import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { clients, activities } from "@/db/schema";
import { requireSession } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["lead", "active", "archived"]),
  notes: z.string().optional(),
});

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(_prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const id = nanoid();
  await db.insert(clients).values({ id, tenantId, ...parsed.data });

  await db
    .insert(activities)
    .values({ id: nanoid(), tenantId, clientId: id, type: "note", content: "Client added." });

  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, _prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = (
    await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .limit(1)
  )[0];
  if (!existing) return { error: "Client not found" };

  await db
    .update(clients)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

  if (existing.status !== parsed.data.status) {
    await db
      .insert(activities)
      .values({
        id: nanoid(),
        tenantId,
        clientId: id,
        type: "status_change",
        content: `Status changed from ${existing.status} to ${parsed.data.status}.`,
      });
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

const activitySchema = z.object({
  type: z.enum(["note", "call", "email", "meeting"]),
  content: z.string().min(1, "Write something first"),
});

export async function addActivity(clientId: string, _prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .insert(activities)
    .values({ id: nanoid(), tenantId, clientId, ...parsed.data });

  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true };
}

export async function deleteClient(id: string) {
  const { tenantId } = await requireSession();
  try {
    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));
  } catch {
    return { error: "This client has invoices on file and can't be deleted. Archive them instead." };
  }
  revalidatePath("/clients");
  redirect("/clients");
}
