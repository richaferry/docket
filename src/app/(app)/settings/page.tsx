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
      <div className="flex max-w-3xl flex-col gap-6 px-8 py-6">
        <Card>
          <CardHeader>
            <p className="font-medium text-ink">Business profile</p>
          </CardHeader>
          <CardBody>
            <BusinessProfileForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-medium text-ink">Invoice defaults</p>
          </CardHeader>
          <CardBody>
            <InvoiceDefaultsForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-medium text-ink">Email delivery</p>
          </CardHeader>
          <CardBody>
            <EmailSettingsForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-medium text-ink">Security</p>
          </CardHeader>
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
