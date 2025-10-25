import { Breadcrumb } from "@/components/common";
import { FileText, AlertTriangle, Shield, Scale } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using Imaginears Club Minecraft server and website.",
};

export default function TermsOfServicePage() {
  return (
    <section className="band">
      <div className="container py-10">
        <Breadcrumb items={[{ label: "Terms of Service" }]} />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Terms of Service
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8">
              <p className="text-sm text-amber-900 dark:text-amber-100 m-0">
                <strong>Important:</strong> By using Imaginears Club, you agree to these terms. Please read them carefully before using our services.
              </p>
            </div>

            {/* Agreement to Terms */}
            <section>
              <h2 className="flex items-center gap-2">
                <Scale className="w-6 h-6" />
                Agreement to Terms
              </h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use of Imaginears Club's Minecraft server, 
                website, and related services (collectively, the "Service"). By accessing or using our Service, you agree 
                to be bound by these Terms.
              </p>
              <p>
                If you do not agree to these Terms, you must not access or use our Service.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2>Eligibility</h2>
              <p>
                You must meet the following requirements to use our Service:
              </p>
              <ul>
                <li>Be at least 13 years old, or have parental/guardian consent</li>
                <li>Have a valid Minecraft account (Java Edition)</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
              <p>
                <strong>Parental Consent:</strong> If you are under 18, your parent or legal guardian must review and 
                agree to these Terms on your behalf.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2>User Accounts</h2>
              
              <h3>Account Creation</h3>
              <p>To access certain features, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3>Account Termination</h3>
              <p>We reserve the right to suspend or terminate your account if you:</p>
              <ul>
                <li>Violate these Terms</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Harm other users or the Service</li>
                <li>Remain inactive for an extended period</li>
              </ul>
            </section>

            {/* Community Rules */}
            <section>
              <h2 className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Community Rules
              </h2>
              
              <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg my-4">
                <h4 className="text-red-900 dark:text-red-100 mt-0 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Prohibited Conduct
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200 m-0">
                  The following behaviors will result in immediate account suspension or termination:
                </p>
              </div>

              <h3>You must NOT:</h3>
              <ul>
                <li><strong>Harassment:</strong> Bully, threaten, or harass other users</li>
                <li><strong>Hate Speech:</strong> Use racist, sexist, homophobic, or discriminatory language</li>
                <li><strong>Cheating:</strong> Use hacks, mods, or exploits that give unfair advantages</li>
                <li><strong>Griefing:</strong> Destroy or vandalize others' builds without permission</li>
                <li><strong>Spam:</strong> Send unsolicited messages or advertisements</li>
                <li><strong>Impersonation:</strong> Pretend to be staff, moderators, or other users</li>
                <li><strong>Inappropriate Content:</strong> Share explicit, violent, or disturbing content</li>
                <li><strong>Personal Information:</strong> Share others' personal information without consent</li>
                <li><strong>Real Money Trading:</strong> Sell in-game items or ranks for real money</li>
                <li><strong>Ban Evasion:</strong> Create alt accounts to circumvent bans</li>
              </ul>

              <h3>You MUST:</h3>
              <ul>
                <li>Treat all community members with respect</li>
                <li>Follow staff instructions and decisions</li>
                <li>Report rule violations to staff</li>
                <li>Use appropriate language in public channels</li>
                <li>Respect others' builds and property</li>
                <li>Maintain a family-friendly environment</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2>Intellectual Property</h2>
              
              <h3>Our Content</h3>
              <p>All content on our Service, including but not limited to:</p>
              <ul>
                <li>Custom builds and designs</li>
                <li>Website design and layout</li>
                <li>Logos, branding, and graphics</li>
                <li>Server plugins and configurations</li>
                <li>Documentation and guides</li>
              </ul>
              <p>
                ...are owned by Imaginears Club or our licensors and protected by copyright and trademark laws.
              </p>

              <h3>Your Content</h3>
              <p>By creating content on our server (builds, chat messages, etc.), you grant us:</p>
              <ul>
                <li>A worldwide, non-exclusive license to use, display, and reproduce your content</li>
                <li>The right to feature your builds in promotional materials</li>
                <li>The right to moderate or remove content that violates our rules</li>
              </ul>
              <p>
                You retain ownership of your original creations but agree not to use them in ways that harm our Service.
              </p>

              <h3>Minecraft and Third-Party Rights</h3>
              <p>
                Minecraft is a trademark of Mojang Studios. We are not affiliated with, endorsed by, or sponsored by 
                Mojang Studios or Microsoft. This is an independent fan server.
              </p>
            </section>

            {/* Donations and Purchases */}
            <section>
              <h2>Donations and Purchases</h2>
              <p>
                If you choose to donate or purchase ranks/perks:
              </p>
              <ul>
                <li>All payments are voluntary donations</li>
                <li>Ranks and perks are virtual goods with no real-world value</li>
                <li>No refunds except as required by law or at our discretion</li>
                <li>Benefits may change or be removed with notice</li>
                <li>Payments do not exempt you from following rules</li>
              </ul>
              <p>
                <strong>Chargebacks:</strong> Fraudulent chargebacks will result in immediate account termination.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2>Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law:
              </p>
              <ul>
                <li>We provide the Service "as is" without warranties of any kind</li>
                <li>We are not liable for any damages arising from use of our Service</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for user-generated content</li>
                <li>Our total liability shall not exceed the amount you paid us (if any)</li>
              </ul>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2>Privacy and Data Protection</h2>
              <p>
                Your use of our Service is also governed by our{" "}
                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
                , which explains how we collect, use, and protect your personal information.
              </p>
              <p>Key points:</p>
              <ul>
                <li>We comply with GDPR and other privacy regulations</li>
                <li>You have rights to access, export, and delete your data</li>
                <li>We use cookies with your consent (except essential ones)</li>
                <li>We never sell your personal information</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section>
              <h2>Disclaimer</h2>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm m-0">
                  <strong>Not Affiliated with Disney:</strong> Imaginears Club is a fan-created Minecraft server 
                  inspired by Disney theme parks. We are not affiliated with, endorsed by, or sponsored by The Walt 
                  Disney Company. All Disney-related trademarks and content belong to their respective owners.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2>Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of significant changes via:
              </p>
              <ul>
                <li>Email notification (if you have an account)</li>
                <li>Notice on our website</li>
                <li>In-game announcement</li>
              </ul>
              <p>
                Continued use of our Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2>Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or use of our Service shall be resolved through binding arbitration,
                except where prohibited by law.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2>Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
                or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2>Contact Information</h2>
              <p>For questions about these Terms, please contact us:</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="m-0"><strong>Email:</strong> support@imaginears.club</p>
                <p className="m-0 mt-2"><strong>Discord:</strong> Join our community server</p>
              </div>
            </section>

            {/* Acknowledgment */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 rounded-r-lg mt-8">
              <p className="text-sm text-blue-900 dark:text-blue-100 m-0">
                <strong>By using Imaginears Club, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

