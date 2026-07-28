import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { buildInvoicePdfData } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/invoice-document";
import { requireSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!invoice) return new Response("Not found", { status: 404 });

  const data = buildInvoicePdfData(id);
  const buffer = await renderInvoicePdf(data);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
