import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container max-w-3xl mx-auto">
                <Button variant="ghost" className="mb-8" asChild>
                    <Link href="/"><ChevronLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
                </Button>

                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                <Card>
                    <CardContent className="p-8 prose dark:prose-invert max-w-none">
                        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

                        <h3>1. Acceptance of Terms</h3>
                        <p>
                            By accessing and using Jyotish Career, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                        </p>

                        <h3>2. Astrology Services Disclaimer</h3>
                        <p>
                            <strong>For Entertainment and Educational Purposes Only:</strong> The astrological reports, career guidance, and remedies provided by Jyotish Career are based on Vedic Astrology principles. They are for educational and entertainment purposes only. They should not be considered as a substitute for professional legal, medical, financial, or career advice. We do not guarantee the accuracy of predictions.
                        </p>

                        <h3>3. User Responsibilities</h3>
                        <p>
                            You agree to provide accurate birth details for chart generation. You are responsible for maintaining the confidentiality of your account information if you choose to create one.
                        </p>

                        <h3>4. Intellectual Property</h3>
                        <p>
                            The content, features, and functionality of Jyotish Career, including but not limited to text, graphics, logos, and software, are the exclusive property of Jyotish Career and are protected by copyright and other intellectual property laws.
                        </p>

                        <h3>5. Changes to Terms</h3>
                        <p>
                            We reserve the right to modify these terms at any time. Your continued use of the platform following any changes indicates your acceptance of the new Terms of Service.
                        </p>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
