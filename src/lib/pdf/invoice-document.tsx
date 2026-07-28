import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const INK = "#211d16";
const MUTED = "#6b6455";
const LINE = "#e3dac4";
const ACCENT = "#b7492b";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 36 },
  businessName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { color: MUTED },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right", color: ACCENT },
  invoiceMeta: { textAlign: "right", marginTop: 6 },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  label: { fontSize: 8, textTransform: "uppercase", color: MUTED, marginBottom: 4, letterSpacing: 0.5 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 7,
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colRate: { width: 70, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  totalFinalLabel: { fontFamily: "Helvetica-Bold" },
  totalFinalAmount: { fontFamily: "Helvetica-Bold", color: ACCENT },
  footer: { marginTop: 40, paddingTop: 16, borderTopWidth: 1, borderTopColor: LINE },
  footerCol: { marginBottom: 14 },
});

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function date(d: Date | number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export type InvoicePdfData = {
  number: string;
  issueDate: Date | number;
  dueDate: Date | number;
  paymentTermsLabel?: string;
  currency: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid?: number;
  notes?: string | null;
  terms?: string | null;
  business: {
    name: string;
    email: string;
    address: string;
    phone: string;
    paymentInstructions: string;
  };
  client: {
    name: string;
    company?: string | null;
    email: string;
    address?: string | null;
  };
};

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{data.business.name}</Text>
            {data.business.address ? <Text style={styles.muted}>{data.business.address}</Text> : null}
            {data.business.email ? <Text style={styles.muted}>{data.business.email}</Text> : null}
            {data.business.phone ? <Text style={styles.muted}>{data.business.phone}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <Text>{data.number}</Text>
              <Text style={styles.muted}>Issued {date(data.issueDate)}</Text>
              <Text style={styles.muted}>
                Due {date(data.dueDate)}
                {data.paymentTermsLabel && data.paymentTermsLabel !== "Custom"
                  ? ` (${data.paymentTermsLabel})`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View>
            <Text style={styles.label}>Bill to</Text>
            <Text>{data.client.company || data.client.name}</Text>
            {data.client.company ? <Text style={styles.muted}>{data.client.name}</Text> : null}
            <Text style={styles.muted}>{data.client.email}</Text>
            {data.client.address ? <Text style={styles.muted}>{data.client.address}</Text> : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.label]}>Description</Text>
          <Text style={[styles.colQty, styles.label]}>Qty</Text>
          <Text style={[styles.colRate, styles.label]}>Rate</Text>
          <Text style={[styles.colAmount, styles.label]}>Amount</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>{money(item.unitPrice, data.currency)}</Text>
            <Text style={styles.colAmount}>{money(item.quantity * item.unitPrice, data.currency)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(data.subtotal, data.currency)}</Text>
          </View>
          {data.discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Discount</Text>
              <Text>-{money(data.discount, data.currency)}</Text>
            </View>
          )}
          {data.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>
                {data.taxLabel} ({data.taxRate}%)
              </Text>
              <Text>{money(data.taxAmount, data.currency)}</Text>
            </View>
          )}
          {data.amountPaid && data.amountPaid > 0 ? (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Total</Text>
                <Text>{money(data.total, data.currency)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Paid</Text>
                <Text>-{money(data.amountPaid, data.currency)}</Text>
              </View>
              <View style={styles.totalRowFinal}>
                <Text style={styles.totalFinalLabel}>Balance due</Text>
                <Text style={styles.totalFinalAmount}>
                  {money(Math.max(data.total - data.amountPaid, 0), data.currency)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalFinalLabel}>Total due</Text>
              <Text style={styles.totalFinalAmount}>{money(data.total, data.currency)}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {data.terms ? (
            <View style={styles.footerCol}>
              <Text style={styles.label}>Terms</Text>
              <Text style={styles.muted}>{data.terms}</Text>
            </View>
          ) : null}
          {data.notes ? (
            <View style={styles.footerCol}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.muted}>{data.notes}</Text>
            </View>
          ) : null}
          {data.business.paymentInstructions ? (
            <View style={styles.footerCol}>
              <Text style={styles.label}>Payment instructions</Text>
              <Text style={styles.muted}>{data.business.paymentInstructions}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
