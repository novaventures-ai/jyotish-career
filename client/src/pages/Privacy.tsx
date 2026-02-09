import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container max-w-3xl mx-auto">
                <Button variant="ghost" className="mb-8" asChild>
                    <Link href="/"><ChevronLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
                </Button>

                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <Card>
                    <CardContent className="p-8 prose dark:prose-invert max-w-none">
                        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

                        <h3>1. Introduction</h3>
                        <p>
                            Welcome to Jyotish Career ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website and use our astrology services.
                        </p>

                        <h3>2. Information We Collect</h3>
                        <p>
                            We collect information that you voluntarily provide to us when you use our services, specifically:
                        </p>
                        <ul>
                            <li><strong>Birth Details:</strong> Date, time, and place of birth (required for chart calculation).</li>
                            <li><strong>Profile Information:</strong> Name/Alias (for report personalization).</li>
                            <li><strong>Account Data:</strong> Email address and authentication tokens if you sign in via Google.</li>
                        </ul>

                        <h3>3. How We Use Your Information</h3>
                        <p>
                            We use your information primarily to:
                        </p>
                        <ul>
                            <li>Calculate your Vedic birth chart and divisional charts.</li>
                            <li>Generate personalized career and wealth analysis.</li>
                            <li>Maintain your user account and save your chart history (if logged in).</li>
                        </ul>

                        <h3>4. Data Protection</h3>
                        <p>
                            Your birth data is processed securely. We implement appropriate technical security measures to protect your personal information. We do not sell, trade, or rent your personal identification information to others.
                        </p>

                        <h3>5. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us through our administrative channels.
                        </p>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
