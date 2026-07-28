"use client";

import { useActionState } from "react";
import { Send, Download, CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { sendInvoice, markInvoicePaid, cancelInvoice, reopenInvoice } from "@/actions/invoices";
import type { DisplayStatus } from "@/lib/invoices";

export function InvoiceActions({
  id,
  status,
  publicId,
}: {
  id: string;
  status: DisplayStatus;
  publicId: string;
}) {
  const boundSend = sendInvoice.bind(null, id);
  const [sendState, sendAction, sending] = useActionState(boundSend, undefined);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" && (
          <LinkButton href={`/invoices/${id}/edit`} variant="secondary" size="sm">
            Edit
          </LinkButton>
        )}

        <LinkButton href={`/invoices/${id}/pdf`} variant="secondary" size="sm">
          <Download size={14} aria-hidden="true" /> PDF
        </LinkButton>

        {(status === "draft" || status === "sent" || status === "overdue") && (
          <form action={sendAction}>
            <Button type="submit" size="sm" disabled={sending}>
              <Send size={14} aria-hidden="true" />{" "}
              {sending ? "Sending…" : status === "draft" ? "Send invoice" : "Resend"}
            </Button>
          </form>
        )}

        {(status === "sent" || status === "overdue") && (
          <form action={markInvoicePaid.bind(null, id)}>
            <Button type="submit" variant="secondary" size="sm">
              <CheckCircle2 size={14} aria-hidden="true" /> Mark paid
            </Button>
          </form>
        )}

        {status !== "cancelled" && status !== "paid" && (
          <form action={cancelInvoice.bind(null, id)}>
            <Button type="submit" variant="ghost" size="sm">
              <Ban size={14} aria-hidden="true" /> Cancel
            </Button>
          </form>
        )}

        {status === "cancelled" && (
          <form action={reopenInvoice.bind(null, id)}>
            <Button type="submit" variant="secondary" size="sm">
              <RotateCcw size={14} aria-hidden="true" /> Reopen as draft
            </Button>
          </form>
        )}
      </div>
      {sendState?.error && <p role="alert" className="text-xs text-danger">{sendState.error}</p>}
      {sendState?.success && (
        <p role="status" className="text-xs text-success">
          Sent. Client link: /i/{publicId}
        </p>
      )}
    </div>
  );
}
