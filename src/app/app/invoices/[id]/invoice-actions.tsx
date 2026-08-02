"use client";

import { useActionState } from "react";
import { Send, Download, CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { sendInvoice, markInvoicePaid, cancelInvoice, reopenInvoice } from "@/actions/invoices";
import type { DisplayStatus } from "@/lib/invoices";

const OPEN_STATUSES: DisplayStatus[] = ["draft", "sent", "overdue", "partial"];
const UNPAID_UNSENT_STATUSES: DisplayStatus[] = ["sent", "overdue", "partial"];

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

  const boundCancel = cancelInvoice.bind(null, id);
  const [cancelState, cancelAction, cancelling] = useActionState(boundCancel, undefined);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" && (
          <LinkButton href={`/app/invoices/${id}/edit`} variant="secondary" size="sm">
            Edit
          </LinkButton>
        )}

        <LinkButton href={`/app/invoices/${id}/pdf`} variant="secondary" size="sm">
          <Download size={14} aria-hidden="true" /> PDF
        </LinkButton>

        {OPEN_STATUSES.includes(status) && (
          <form action={sendAction}>
            <Button type="submit" size="sm" disabled={sending}>
              <Send size={14} aria-hidden="true" />{" "}
              {sending ? "Sending…" : status === "draft" ? "Send invoice" : "Resend"}
            </Button>
          </form>
        )}

        {UNPAID_UNSENT_STATUSES.includes(status) && (
          <form action={markInvoicePaid.bind(null, id)}>
            <Button type="submit" variant="secondary" size="sm">
              <CheckCircle2 size={14} aria-hidden="true" /> Mark paid
            </Button>
          </form>
        )}

        {status !== "cancelled" && status !== "paid" && (
          <form action={cancelAction}>
            <Button type="submit" variant="ghost" size="sm" disabled={cancelling}>
              <Ban size={14} aria-hidden="true" /> {cancelling ? "Cancelling…" : "Cancel"}
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
      {cancelState?.error && <p role="alert" className="text-xs text-danger">{cancelState.error}</p>}
    </div>
  );
}
