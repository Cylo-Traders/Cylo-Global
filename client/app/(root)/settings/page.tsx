"use client";

import { User, MapPin, Bell, Shield } from "lucide-react";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="pt-28 pb-16">
      <Wrapper className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="size-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1.5">
              <MapPin className="size-4" />
              Location
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="size-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="rounded-[28px] border bg-card p-6 sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <User className="size-5" />
                Profile Information
              </h2>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" defaultValue="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    defaultValue="Organic farmer from Lagos with 10 years of experience"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select defaultValue="farmer">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" placeholder="https://..." />
                </div>
                <Button className="w-full sm:w-auto">Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="rounded-[28px] border bg-card p-6 sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5" />
                Location Settings
              </h2>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="Lagos" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" defaultValue="Nigeria" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" type="number" step="any" defaultValue="6.5244" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" type="number" step="any" defaultValue="3.3792" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">Public Location</p>
                    <p className="text-xs text-muted-foreground">
                      Show your location on the farmer map
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="w-full sm:w-auto">Update Location</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="rounded-[28px] border bg-card p-6 sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <Bell className="size-5" />
                Notification Preferences
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Order Created",
                    description: "When a buyer places a new order",
                    defaultChecked: true,
                  },
                  {
                    title: "Payment Received",
                    description: "When a buyer confirms receipt and payment is released",
                    defaultChecked: true,
                  },
                  {
                    title: "Order Refunded",
                    description: "When an order expires and is auto-refunded",
                    defaultChecked: true,
                  },
                  {
                    title: "Price Alerts",
                    description: "Notifications about market price changes",
                    defaultChecked: false,
                  },
                  {
                    title: "Platform Updates",
                    description: "News and feature announcements",
                    defaultChecked: false,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
                <Button className="w-full sm:w-auto">Save Preferences</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Wrapper>
    </div>
  );
}
