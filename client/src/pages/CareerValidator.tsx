import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Target, ArrowRight, BrainCircuit, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useProfile } from "../hooks/useProfile";

const formSchema = z.object({
    currentRole: z.string().min(2, "Current role is required"),
    targetRole: z.string().optional(),
});

export function CareerValidator() {
    const { profile } = useProfile();
    const [result, setResult] = useState<any>(null); // Type this properly later

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentRole: "",
            targetRole: "",
        },
    });

    const validateMutation = trpc.ai.validateCareer.useMutation({
        onSuccess: (data) => {
            setResult(data);
            toast.success("Cosmic Analysis Complete!");
        },
        onError: (error) => {
            toast.error(`Analysis failed: ${error.message}`);
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!profile) {
            toast.error("Please create or select a profile first");
            return;
        }

        // Handle guest vs auth profile
        const profileId = profile.id && profile.id > 0 ? profile.id : undefined;
        // @ts-ignore - chartData exists on profile from useProfile hook
        const chartData = profile.chartData;

        if (!profileId && !chartData) {
            toast.error("No chart data available");
            return;
        }

        validateMutation.mutate({
            profileId,
            chartData,
            currentRole: values.currentRole,
            targetRole: values.targetRole || undefined, // Send undefined if empty string
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    AI Career Validator
                </h1>
                <p className="text-muted-foreground">
                    Analyze the compatibility of your career goals with your astrological DNA.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Input Card */}
                <Card className="md:col-span-1 h-fit border-primary/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Career Path
                        </CardTitle>
                        <CardDescription>
                            Where are you now, and where do you want to go?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Role</Label>
                                <Input placeholder="e.g. Accountant" {...form.register("currentRole")} />
                                {form.formState.errors.currentRole && (
                                    <p className="text-xs text-red-500">{form.formState.errors.currentRole.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Target Role (Optional)</Label>
                                <Input placeholder="Leave empty to validate current role" {...form.register("targetRole")} />
                                {form.formState.errors.targetRole && (
                                    <p className="text-xs text-red-500">{form.formState.errors.targetRole.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                                disabled={validateMutation.isPending}
                            >
                                {validateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consulting the Stars...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Validate Path
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results Area */}
                <div className="md:col-span-1 lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {!result && !validateMutation.isPending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20"
                            >
                                <BrainCircuit className="w-12 h-12 mb-4 opacity-50" />
                                <p>Enter your career details to generate a cosmic analysis</p>
                            </motion.div>
                        )}

                        {validateMutation.isPending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-64 space-y-4"
                            >
                                <div className="relative w-24 h-24">
                                    <motion.div
                                        className="absolute inset-0 border-4 border-purple-200 rounded-full"
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-t-purple-600 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    />
                                </div>
                                <p className="text-lg font-medium animate-pulse">Aligning Planetary Energies...</p>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Score Header */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Card className="md:col-span-1 border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-slate-300">Compatibility Score</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center pb-6">
                                            <div className="relative flex items-center justify-center">
                                                <svg className="w-32 h-32 transform -rotate-90">
                                                    <circle
                                                        className="text-slate-700"
                                                        strokeWidth="8"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="58"
                                                        cx="64"
                                                        cy="64"
                                                    />
                                                    <circle
                                                        className={`${result.compatibilityScore > 70 ? 'text-green-500' : result.compatibilityScore > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                                        strokeWidth="8"
                                                        strokeDasharray={365}
                                                        strokeDashoffset={365 - (365 * result.compatibilityScore) / 100}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="58"
                                                        cx="64"
                                                        cy="64"
                                                    />
                                                </svg>
                                                <span className="absolute text-3xl font-bold">{result.compatibilityScore}%</span>
                                            </div>
                                            <Badge variant="outline" className="mt-2 text-white border-white/20 bg-white/10 backdrop-blur-sm">
                                                {result.compatibilityScore > 70 ? 'Excellent Match' : result.compatibilityScore > 40 ? 'Moderate Match' : 'Challenging Path'}
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    {/* Smart Pivot */}
                                    {result.smartPivot && (
                                        <Card className="md:col-span-2 border-primary/20 bg-purple-50/50 dark:bg-purple-900/10">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                                    <Lightbulb className="w-5 h-5" />
                                                    Smart Pivot Suggestion
                                                </CardTitle>
                                                <CardDescription>
                                                    A bridge role that connects your current skills with your chart.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-col gap-2">
                                                    <div className="font-semibold text-lg">{result.smartPivot.suggestedRole}</div>
                                                    <p className="text-sm text-muted-foreground">{result.smartPivot.reason}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Analysis & Strategy */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Cosmic Analysis */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                                Cosmic Analysis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{result.analysis}</ReactMarkdown>
                                        </CardContent>
                                    </Card>

                                    {/* Strategy Timeline */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ArrowRight className="w-5 h-5 text-blue-500" />
                                                Pivot Strategy
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="relative space-y-0 ml-2">
                                                {result.strategy && Array.isArray(result.strategy) ? (
                                                    result.strategy.map((step: string, index: number) => (
                                                        <div key={index} className="flex gap-4 pb-8 relative last:pb-0">
                                                            {/* Line */}
                                                            {index !== result.strategy.length - 1 && (
                                                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                                                            )}
                                                            {/* Dot */}
                                                            <div className="relative bg-background z-10">
                                                                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            {/* Content */}
                                                            <div className="pt-0.5">
                                                                <p className="text-sm">{step}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">No specific strategy steps identified.</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
