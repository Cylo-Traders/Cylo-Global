"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, Clock } from "lucide-react";
import { RiTwitterXLine } from "react-icons/ri";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const contactOptions = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Our team typically replies within 24 hours.",
    value: "hello@cylo.ag",
    href: "mailto:hello@cylo.ag",
  },
  {
    icon: RiTwitterXLine,
    title: "Twitter / X",
    description: "Follow us and send a DM anytime.",
    value: "@AgricCylo",
    href: "https://x.com/AgricCylo",
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "We reply to all inquiries",
    value: "Within 24 hours",
    href: undefined,
  },
];

const faqItems = [
  {
    q: "What wallets does Cylo support?",
    a: "Cylo supports Argent X and Braavos — the most popular Starknet wallets. More wallets will be added as the ecosystem grows.",
  },
  {
    q: "What tokens can I use to pay?",
    a: "Currently Cylo supports STRK and USDC on Starknet mainnet and Sepolia testnet.",
  },
  {
    q: "How does the escrow work?",
    a: "When you place an order, funds are locked in a smart contract. Once you confirm receipt, funds are released to the farmer minus the 3% platform fee.",
  },
  {
    q: "What happens if I don't confirm delivery?",
    a: "Orders auto-expire after 96 hours. If you haven't confirmed, funds are automatically refunded to your wallet.",
  },
  {
    q: "How do I become a seller on Cylo?",
    a: "Connect your Starknet wallet, go through onboarding to set up your farmer profile, then start listing products.",
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    toast.success("Message sent! We'll get back to you within 24 hours.");
  }

  return (
    <div className="pt-28 pb-16">
      {/* Hero */}
      <section className="mb-20">
        <Wrapper>
          <div className="max-w-2xl">
            <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium">
              Contact Us
            </span>
            <h1 className="text-foreground text-3xl font-semibold sm:text-4xl md:text-5xl">
              We&apos;d love to hear from you
            </h1>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed md:text-lg">
              Whether you have a question about the platform, need help with an order, or want to
              partner with us — our team is here to help.
            </p>
          </div>
        </Wrapper>
      </section>

      <section className="mb-20">
        <Wrapper>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Form */}
            <div className="rounded-[32px] border bg-card p-8">
              <h2 className="mb-6 text-xl font-semibold">Send us a message</h2>
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-full">
                    <Send className="text-primary size-7" />
                  </div>
                  <h3 className="text-lg font-semibold">Message Sent!</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Thanks for reaching out. We&apos;ll reply within 24 hours.
                  </p>
                  <Button className="mt-6" onClick={() => setSent(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="What is this about?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Support</SelectItem>
                        <SelectItem value="seller">Becoming a Seller</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your question or issue..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <Send className="mr-2 size-4" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactOptions.map((option) => (
                <div
                  key={option.title}
                  className="flex gap-4 rounded-[24px] border bg-card p-6"
                >
                  <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-2xl">
                    <option.icon className="text-primary size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{option.title}</h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">{option.description}</p>
                    {option.href ? (
                      <a
                        href={option.href}
                        target={option.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-primary mt-1 block text-sm font-medium hover:underline"
                      >
                        {option.value}
                      </a>
                    ) : (
                      <p className="text-primary mt-1 text-sm font-medium">{option.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-primary/5 rounded-[24px] border border-primary/20 p-6">
                <h3 className="mb-2 font-semibold">Powered by Starknet</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Cylo operates on Starknet — a ZK-rollup Layer 2 on Ethereum. All transactions
                  are verifiable on-chain and secured by zero-knowledge proofs.
                </p>
              </div>
            </div>
          </div>
        </Wrapper>
      </section>

      {/* FAQ */}
      <section>
        <Wrapper>
          <div className="mb-10">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-[24px] border bg-card p-6">
                <h3 className="mb-2 font-semibold">{item.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
    </div>
  );
}
