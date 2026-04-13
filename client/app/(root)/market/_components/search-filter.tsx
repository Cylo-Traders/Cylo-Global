"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/utils";

export function SearchFilter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="h-12 rounded-[20px] pl-10"
        />
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-12 w-full rounded-[20px] sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="lg" className="h-12">
        <Search className="size-4" />
        Search
      </Button>
    </div>
  );
}
