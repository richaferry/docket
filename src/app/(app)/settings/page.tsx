import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import {
  BusinessProfileForm,
  InvoiceDefaultsForm,
  EmailSettingsForm,
  ChangePasswordForm,
} from "./forms";

export default function SettingsPage() {
  const settings = getSettings();

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" />
      <div className="flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
        <Card>
          <CardHeader>
            <h2 className="font-medium text-ink">Business profile</h2>
          </CardHeader>
          <CardBody>
            <BusinessProfileForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-ink">Invoice defaults</h2>
          </CardHeader>
          <CardBody>
            <InvoiceDefaultsForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-ink">Email delivery</h2>
          </CardHeader>
          <CardBody>
            <EmailSettingsForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-ink">Security</h2>
          </CardHeader>
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
