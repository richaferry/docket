import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { buildInvoicePdfData } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/invoice-document";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const invoice = db.select().from(invoices).where(eq(invoices.publicId, publicId)).get();
  if (!invoice) return new Response("Not found", { status: 404 });

  const data = buildInvoicePdfData(invoice.id);
  const buffer = await renderInvoicePdf(data);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
