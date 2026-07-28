import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";
import type { Settings } from "@/lib/settings";
import { getSettings } from "@/lib/settings";

vi.mock("@/lib/settings", () => ({
  getSettings: vi.fn(),
}));

vi.mock("nodemailer", () => {
  // A fresh sendMail mock per createTransport() call keeps each test's
  // assertions isolated from calls made by other tests.
  const createTransport = vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
  }));
  return { default: { createTransport }, createTransport };
});

import { sendMail, MailerNotConfiguredError, MailProviderError } from "@/lib/mailer";

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    id: 1,
    authSecret: "secret",
    adminEmail: "admin@example.com",
    adminPasswordHash: "hash",
    failedLoginAttempts: 0,
    loginLockedUntil: null,
    businessName: "Acme Co",
    businessEmail: "hello@acme.test",
    businessAddress: "",
    businessPhone: "",
    logoUrl: null,
    paymentInstructions: "",
    taxLabel: "Tax",
    defaultTaxRate: 0,
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
    currency: "USD",
    defaultTerms: "Payment due within 14 days.",
    defaultPaymentTerms: "net_14",
    emailProvider: "smtp",
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "smtp-user",
    smtpPass: "smtp-pass",
    fromName: "Acme Sender",
    fromEmail: "sender@acme.test",
    mailanvilApiKey: null,
    ...overrides,
  };
}

const baseOptions = {
  to: "client@example.com",
  subject: "Invoice INV-0001",
  html: "<p>Hello</p>",
};

describe("sendMail", () => {
  beforeEach(() => {
    vi.mocked(getSettings).mockReset();
    vi.mocked(nodemailer.createTransport).mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("MailerNotConfiguredError / MailProviderError", () => {
    it("carries the expected name and message", () => {
      const notConfigured = new MailerNotConfiguredError();
      expect(notConfigured.name).toBe("MailerNotConfiguredError");
      expect(notConfigured.message).toBe(
        "Email isn't configured yet. Add your provider details in Settings to send invoices.",
      );

      const providerError = new MailProviderError("boom");
      expect(providerError.name).toBe("MailProviderError");
      expect(providerError.message).toBe("boom");
    });
  });

  describe("routing", () => {
    it("routes to SMTP when emailProvider is smtp", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ emailProvider: "smtp" }));
      await sendMail(baseOptions);
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("routes to MailAnvil when emailProvider is mailanvil", async () => {
      vi.mocked(getSettings).mockReturnValue(
        makeSettings({ emailProvider: "mailanvil", mailanvilApiKey: "key_123" }),
      );
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
      await sendMail(baseOptions);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe("SMTP transport", () => {
    it("throws MailerNotConfiguredError when smtpHost is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ smtpHost: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
    });

    it("throws MailerNotConfiguredError when smtpUser is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ smtpUser: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
    });

    it("throws MailerNotConfiguredError when smtpPass is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ smtpPass: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
    });

    it("throws MailerNotConfiguredError when fromEmail is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ fromEmail: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
    });

    it("creates a transporter with the configured host/port/secure/auth and sends the message", async () => {
      const settings = makeSettings({
        smtpHost: "smtp.acme.test",
        smtpPort: 2525,
        smtpSecure: true,
        smtpUser: "acme-user",
        smtpPass: "acme-pass",
        fromName: "Acme Billing",
        fromEmail: "billing@acme.test",
      });
      vi.mocked(getSettings).mockReturnValue(settings);

      const attachments = [{ filename: "invoice.pdf", content: Buffer.from("pdf-bytes") }];
      await sendMail({ ...baseOptions, attachments });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.acme.test",
        port: 2525,
        secure: true,
        auth: { user: "acme-user", pass: "acme-pass" },
      });

      const transporter = vi.mocked(nodemailer.createTransport).mock.results[0].value;
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: "Acme Billing <billing@acme.test>",
        to: baseOptions.to,
        subject: baseOptions.subject,
        html: baseOptions.html,
        attachments,
      });
    });

    it("defaults the SMTP port to 587 when smtpPort is not set", async () => {
      vi.mocked(getSettings).mockReturnValue(makeSettings({ smtpPort: null }));
      await sendMail(baseOptions);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 587 }),
      );
    });

    it("falls back to businessName for the from display name when fromName is not set", async () => {
      vi.mocked(getSettings).mockReturnValue(
        makeSettings({ fromName: null, businessName: "Acme Co", fromEmail: "billing@acme.test" }),
      );
      await sendMail(baseOptions);
      const transporter = vi.mocked(nodemailer.createTransport).mock.results[0].value;
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: "Acme Co <billing@acme.test>" }),
      );
    });
  });

  describe("MailAnvil transport", () => {
    function mailanvilSettings(overrides: Partial<Settings> = {}) {
      return makeSettings({
        emailProvider: "mailanvil",
        mailanvilApiKey: "key_123",
        fromEmail: "billing@acme.test",
        fromName: "Acme Billing",
        businessName: "Acme Co",
        ...overrides,
      });
    }

    it("throws MailerNotConfiguredError when mailanvilApiKey is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings({ mailanvilApiKey: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("throws MailerNotConfiguredError when fromEmail is missing", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings({ fromEmail: null }));
      await expect(sendMail(baseOptions)).rejects.toBeInstanceOf(MailerNotConfiguredError);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("posts the expected request body and headers, mapping url-based attachments to path", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

      const attachments = [
        { filename: "invoice.pdf", content: Buffer.from("ignored"), url: "https://example.test/i/abc/pdf" },
      ];
      await sendMail({ ...baseOptions, attachments });

      expect(fetch).toHaveBeenCalledWith(
        "https://api.mailanvil.com/v1/send",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer key_123",
            "Content-Type": "application/json",
          },
        }),
      );

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init!.body as string);
      expect(body).toEqual({
        from: "billing@acme.test",
        from_name: "Acme Billing",
        to: [baseOptions.to],
        subject: baseOptions.subject,
        html: baseOptions.html,
        attachments: [
          { filename: "invoice.pdf", path: "https://example.test/i/abc/pdf", content_type: "application/pdf" },
        ],
      });
    });

    it("maps attachments without a url to base64 content", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

      const content = Buffer.from("pdf-bytes");
      await sendMail({ ...baseOptions, attachments: [{ filename: "invoice.pdf", content }] });

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init!.body as string);
      expect(body.attachments).toEqual([
        { filename: "invoice.pdf", content: content.toString("base64"), content_type: "application/pdf" },
      ]);
    });

    it("omits the attachments field entirely when no attachments are provided", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

      await sendMail(baseOptions);

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init!.body as string);
      expect(body.attachments).toBeUndefined();
    });

    it("falls back to businessName for from_name when fromName is not set", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings({ fromName: null, businessName: "Acme Co" }));
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

      await sendMail(baseOptions);

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init!.body as string);
      expect(body.from_name).toBe("Acme Co");
    });

    it("throws MailProviderError with the API's error message on failure", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Invalid email" } }), { status: 422 }),
      );

      const error = await sendMail(baseOptions).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(MailProviderError);
      expect((error as Error).message).toBe("Invalid email");
    });

    it("falls back to a generic message when the error body has no error.message", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));

      await expect(sendMail(baseOptions)).rejects.toThrow("MailAnvil request failed (500)");
    });

    it("falls back to a generic message when the error body isn't valid JSON", async () => {
      vi.mocked(getSettings).mockReturnValue(mailanvilSettings());
      vi.mocked(fetch).mockResolvedValue(new Response("not json", { status: 503 }));

      await expect(sendMail(baseOptions)).rejects.toThrow("MailAnvil request failed (503)");
    });
  });
});
