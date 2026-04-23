"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  Wallet,
  User,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sprout,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth";
import { apiClient } from "@/lib/api";
import type { UserRole } from "@/lib/types";

const steps = [
  { id: 1, label: "Sign In", icon: Wallet },
  { id: 2, label: "Choose Role", icon: User },
  { id: 3, label: "Profile Setup", icon: MapPin },
  { id: 4, label: "Complete", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { authenticated, login, ready, getAccessToken } = usePrivy();
  const { setProfile } = useAuthStore();

  // Start at step 1 always — useEffect below advances to step 2 once Privy
  // confirms the user is authenticated (handles OAuth redirect timing).
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (step / steps.length) * 100;

  // Once Privy finishes loading and confirms the user is authenticated,
  // advance past the sign-in step automatically. This handles both:
  // - OAuth redirect: page remounts, Privy loads, authenticated becomes true
  // - Email login: login() resolves in-place, authenticated flips to true
  useEffect(() => {
    if (ready && authenticated && step === 1) {
      setStep(2);
    }
  }, [ready, authenticated, step]);

  const handleLogin = () => {
    login();
  };

  const handleSubmitProfile = async () => {
    if (!role || !displayName) return;
    setIsSubmitting(true);

    try {
      const api = apiClient(getAccessToken);
      const profile = await api.post<{
        wallet: string;
        role: UserRole;
        displayName: string;
        bio: string;
        avatar: string;
        createdAt: string;
      }>("/api/auth/register", {
        role,
        displayName,
        bio,
        city,
        country,
      });

      setProfile(profile);
      setStep(4);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (role === "farmer") {
      router.push("/dashboard");
    } else {
      router.push("/market");
    }
  };

  return (
    <div className="pt-40 pb-16">
      <Wrapper className="max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome to Cylo</h1>
          <p className="mt-2 text-muted-foreground">Let&apos;s get you set up in a few steps</p>
        </div>

        <Progress value={progress} className="mb-8" />

        <div className="mb-8 flex justify-center gap-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                step >= s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <s.icon className="size-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border bg-card p-8">
          {/* Step 1: Sign In with Privy */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="size-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sign In to Get Started</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use your email or Google account. We&apos;ll create a secure Starknet wallet for
                  you — no seed phrases needed.
                </p>
              </div>

              {authenticated ? (
                <Button onClick={() => setStep(2)} className="gap-1.5">
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={handleLogin} disabled={!ready} className="gap-1.5">
                  Sign In with Email or Google
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Choose Role */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold">Choose Your Role</h2>
                <p className="mt-2 text-sm text-muted-foreground">Are you here to sell or to buy?</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setRole("farmer")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all hover:shadow-md",
                    role === "farmer" && "border-primary bg-primary/5 ring-2 ring-primary",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                    <Sprout className="size-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Farmer</p>
                    <p className="text-xs text-muted-foreground">Sell your produce directly</p>
                  </div>
                </button>
                <button
                  onClick={() => setRole("buyer")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all hover:shadow-md",
                    role === "buyer" && "border-primary bg-primary/5 ring-2 ring-primary",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
                    <ShoppingBag className="size-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Buyer</p>
                    <p className="text-xs text-muted-foreground">Buy fresh from farmers</p>
                  </div>
                </button>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!role} className="gap-1.5">
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Setup */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">Tell us a bit about yourself</p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name or farm name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell buyers about your farm..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Lagos"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Nigeria"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={handleSubmitProfile}
                  disabled={!displayName || isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Setting up…
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">You&apos;re All Set!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your profile has been created. You&apos;re ready to{" "}
                  {role === "farmer" ? "start selling" : "start buying"}.
                </p>
              </div>
              <Button onClick={handleComplete} size="lg" className="gap-1.5">
                {role === "farmer" ? "Go to Dashboard" : "Browse Marketplace"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </Wrapper>
    </div>
  );
}
