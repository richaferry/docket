"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { clients, activities } from "@/db/schema";

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
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const id = nanoid();
  db.insert(clients)
    .values({ id, ...parsed.data })
    .run();

  db.insert(activities)
    .values({ id: nanoid(), clientId: id, type: "note", content: "Client added." })
    .run();

  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, _prev: unknown, formData: FormData) {
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = db.select().from(clients).where(eq(clients.id, id)).get();
  if (!existing) return { error: "Client not found" };

  db.update(clients)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .run();

  if (existing.status !== parsed.data.status) {
    db.insert(activities)
      .values({
        id: nanoid(),
        clientId: id,
        type: "status_change",
        content: `Status changed from ${existing.status} to ${parsed.data.status}.`,
      })
      .run();
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
  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  db.insert(activities)
    .values({ id: nanoid(), clientId, ...parsed.data })
    .run();

  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true };
}

export async function deleteClient(id: string) {
  try {
    db.delete(clients).where(eq(clients.id, id)).run();
  } catch {
    return { error: "This client has invoices on file and can't be deleted. Archive them instead." };
  }
  revalidatePath("/clients");
  redirect("/clients");
}
