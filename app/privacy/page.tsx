import { Breadcrumb } from "@/components/common";
import { Shield, Mail, Cookie, Database, UserCheck, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how Imaginears Club collects, uses, and protects your personal information in compliance with GDPR and privacy regulations.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="band">
      <div className="container py-10">
        <Breadcrumb items={[{ label: "Privacy Policy" }]} />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
              <p className="text-sm text-blue-900 dark:text-blue-100 m-0">
                <strong>Your privacy matters.</strong> This policy explains how we collect, use, and protect your personal information in compliance with GDPR and other privacy regulations.
              </p>
            </div>

            {/* Data Controller */}
            <section>
              <h2 className="flex items-center gap-2">
                <UserCheck className="w-6 h-6" />
                Data Controller
              </h2>
              <p>
                Imaginears Club ("we", "us", "our") is the data controller responsible for your personal information. 
                For any privacy-related inquiries, please contact us at:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="m-0"><strong>Email:</strong> privacy@imaginears.club</p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                Information We Collect
              </h2>
              
              <h3>Account Information</h3>
              <p>When you create an account, we collect:</p>
              <ul>
                <li>Name (display name)</li>
                <li>Email address</li>
                <li>Minecraft username (if linked)</li>
                <li>Password (encrypted)</li>
                <li>Profile preferences (timezone, theme, etc.)</li>
              </ul>

              <h3>Authentication Data</h3>
              <p>If you use social login (Discord), we collect:</p>
              <ul>
                <li>OAuth provider ID</li>
                <li>Profile information from the provider (name, avatar)</li>
                <li>Email address (if available)</li>
              </ul>

              <h3>Usage Data</h3>
              <p>We automatically collect:</p>
              <ul>
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referral source</li>
              </ul>

              <h3>Cookies and Tracking</h3>
              <p>We use cookies for:</p>
              <ul>
                <li><strong>Essential:</strong> Authentication, session management, security</li>
                <li><strong>Analytics:</strong> Understanding usage patterns (only with consent)</li>
                <li><strong>Marketing:</strong> Personalized content (only with consent)</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                How We Use Your Information
              </h2>
              
              <h3>Legal Basis (GDPR)</h3>
              <p>We process your data based on:</p>
              <ul>
                <li><strong>Consent:</strong> Analytics, marketing cookies</li>
                <li><strong>Contract:</strong> Providing services you requested</li>
                <li><strong>Legitimate Interest:</strong> Security, fraud prevention, service improvement</li>
                <li><strong>Legal Obligation:</strong> Compliance with laws and regulations</li>
              </ul>

              <h3>Purpose of Processing</h3>
              <ul>
                <li>Provide and maintain our Minecraft server community</li>
                <li>Authenticate and manage your account</li>
                <li>Send important service notifications</li>
                <li>Respond to support requests</li>
                <li>Prevent fraud and abuse</li>
                <li>Improve our services (with consent)</li>
                <li>Send marketing communications (with opt-in consent only)</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2>Data Sharing and Third Parties</h2>
              
              <h3>We share data with:</h3>
              <ul>
                <li><strong>Hosting Providers:</strong> For infrastructure and storage</li>
                <li><strong>Authentication Services:</strong> Discord OAuth (if you use social login)</li>
                <li><strong>Analytics Providers:</strong> Only with your consent</li>
              </ul>

              <h3>We DO NOT:</h3>
              <ul>
                <li>Sell your personal information</li>
                <li>Share data with advertisers</li>
                <li>Use your data for purposes other than stated</li>
                <li>Transfer data outside the EU without adequate safeguards</li>
              </ul>
            </section>

            {/* Your Rights (GDPR) */}
            <section>
              <h2 className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Your Privacy Rights (GDPR)
              </h2>
              
              <p>You have the right to:</p>
              
              <div className="grid gap-4 mt-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">🔍 Access</h4>
                  <p className="m-0">Request a copy of your personal data</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">✏️ Rectification</h4>
                  <p className="m-0">Correct inaccurate or incomplete data</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">🗑️ Erasure</h4>
                  <p className="m-0">Request deletion of your personal data ("right to be forgotten")</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">⏸️ Restriction</h4>
                  <p className="m-0">Limit how we process your data</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">📦 Portability</h4>
                  <p className="m-0">Receive your data in a machine-readable format</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">🚫 Object</h4>
                  <p className="m-0">Object to processing based on legitimate interests</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 mt-0">⛔ Withdraw Consent</h4>
                  <p className="m-0">Withdraw consent at any time (doesn't affect prior processing)</p>
                </div>
              </div>

              <p className="mt-6">
                To exercise any of these rights, please visit your{" "}
                <a href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
                  profile settings
                </a>{" "}
                or contact us at privacy@imaginears.club
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                Data Retention
              </h2>
              <p>We retain your data for as long as:</p>
              <ul>
                <li>Your account is active</li>
                <li>Needed to provide services</li>
                <li>Required by law (e.g., financial records)</li>
                <li>Necessary for legitimate business purposes</li>
              </ul>
              <p>
                When you delete your account, we permanently delete your personal data within 30 days,
                except where retention is required by law.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2>Security Measures</h2>
              <p>We implement industry-standard security measures:</p>
              <ul>
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Two-factor authentication (optional)</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2>Children's Privacy</h2>
              <p>
                Our service is family-friendly. However, users under 13 must have parental consent.
                We do not knowingly collect personal information from children under 13 without parental consent.
                If we discover we have collected data from a child under 13 without consent, we will delete it promptly.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="flex items-center gap-2">
                <Cookie className="w-6 h-6" />
                Cookies Policy
              </h2>
              <p>We use cookies to improve your experience. You can manage cookie preferences:</p>
              <ul>
                <li>Through the cookie banner (first visit)</li>
                <li>In your browser settings</li>
                <li>In your profile settings (when logged in)</li>
              </ul>
              <p>
                Essential cookies cannot be disabled as they are necessary for the website to function.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2>International Data Transfers</h2>
              <p>
                If we transfer data outside the European Economic Area (EEA), we ensure adequate protection through:
              </p>
              <ul>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>Other appropriate safeguards</li>
              </ul>
            </section>

            {/* Changes */}
            <section>
              <h2>Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. We will notify you of significant changes via:
              </p>
              <ul>
                <li>Email (if you have an account)</li>
                <li>Notice on our website</li>
                <li>In-app notification</li>
              </ul>
              <p>
                Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Contact Us
              </h2>
              <p>For any privacy-related questions or concerns:</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="m-0"><strong>Email:</strong> privacy@imaginears.club</p>
                <p className="m-0 mt-2"><strong>Response Time:</strong> Within 30 days (GDPR requirement)</p>
              </div>
              <p className="mt-4">
                You also have the right to lodge a complaint with your local data protection authority if you believe
                we have not handled your personal data appropriately.
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

