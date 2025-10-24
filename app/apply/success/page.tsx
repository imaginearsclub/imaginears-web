import { Badge, Alert, Separator, Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Mail, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-static"; // Static page for performance

/**
 * Metadata for SEO
 */
export const metadata = {
    title: "Application Submitted | Imaginears",
    description: "Your application has been successfully submitted. We'll be in touch soon!",
    robots: {
        index: false, // Don't index success pages
        follow: false,
    },
};

export default function ApplySuccess() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className={cn(
                    "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
                    "bg-gradient-to-br from-green-500 to-emerald-500",
                    "shadow-lg"
                )}>
                    <CheckCircle className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                
                <h1 className={cn(
                    "text-3xl md:text-4xl font-bold mb-3",
                    "text-slate-900 dark:text-white"
                )}>
                    Application Submitted!
                </h1>
                
                <Badge variant="success" size="sm" className="mb-4">
                    Successfully Received
                </Badge>
                
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
                    Thank you for applying to Imaginears Club! Your application has been received and is being reviewed by our team.
                </p>
            </div>

            <Separator className="my-8" />

            {/* What Happens Next */}
            <div className="mb-8">
                <h2 className={cn(
                    "text-xl font-bold mb-4 flex items-center gap-2",
                    "text-slate-900 dark:text-white"
                )}>
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    What Happens Next?
                </h2>
                
                <div className="space-y-3">
                    <Card className="p-4">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                                "bg-blue-100 dark:bg-blue-900/30"
                            )}>
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                    Review Process
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Our team will carefully review your application over the next 1-2 weeks.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                                "bg-purple-100 dark:bg-purple-900/30"
                            )}>
                                <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                    We'll Contact You
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    If you're selected for the next step, we'll reach out via Discord or email.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                                "bg-green-100 dark:bg-green-900/30"
                            )}>
                                <Mail className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                    Check Your Inbox
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Make sure to check your spam folder just in case our emails end up there.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Separator className="my-8" />

            {/* Info Alert */}
            <Alert variant="info" className="mb-6">
                <strong>Important:</strong> Due to high application volume, we're unable to provide individual status updates. 
                Please be patient as we review all submissions.
            </Alert>

            {/* Return Home */}
            <div className="text-center">
                <Link 
                    href="/"
                    className={cn(
                        "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                        "bg-blue-600 dark:bg-blue-500",
                        "text-white",
                        "hover:bg-blue-700 dark:hover:bg-blue-600",
                        "border-2 border-transparent",
                        "shadow-md hover:shadow-lg"
                    )}
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
}
