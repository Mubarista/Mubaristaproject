"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Star, ChevronDown } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  active: boolean;
  orderIndex: number;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTools();
    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  async function fetchTools() {
    try {
      const response = await fetch("/api/tools");
      if (response.ok) {
        const data = await response.json();
        setTools(data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch("/api/tool-categories?active=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Marketplace"
            title="Barista Tools"
            description="Professional equipment curated for competition-level baristas. Browse freely, purchase with account."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  const filtered = tools.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayCategories = categories.slice(0, 4);
  const hasMoreCategories = categories.length > 4;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Marketplace"
          title="Barista Tools"
          description="Professional equipment curated for competition-level baristas. Browse freely, purchase with account."
        />

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* All button with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  category === "All" ? "bg-blue text-white" : "bg-muted-bg hover:bg-white/5"
                }`}
              >
                All
                <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setCategory("All");
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      category === "All" ? "bg-blue text-white" : "hover:bg-white/5"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.name);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        category === cat.name ? "bg-blue text-white" : "hover:bg-white/5"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick access categories */}
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat.name ? "bg-blue text-white" : "bg-muted-bg hover:bg-white/5"
                }`}
              >
                {cat.name}
              </button>
            ))}
            
            {hasMoreCategories && (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-white/5 transition-all"
              >
                +{categories.length - 4} more
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`}>
              <Card className="overflow-hidden p-0 cursor-pointer hover:border-blue/50 transition-colors">
                {tool.image ? (
                  <div className="relative h-40">
                    <Image src={tool.image} alt={tool.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                  </div>
                ) : null}
                <div className="p-5">
                  <Badge variant="blue" className="mb-2">{tool.category}</Badge>
                  <CardTitle className="text-base mb-1">{tool.name}</CardTitle>
                  <p className="text-xs text-muted mb-2">{tool.brand}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-3 w-3 fill-yellow text-yellow" />
                    <span className="text-sm">{tool.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green">{formatCurrency(tool.price)}</span>
                    <Button variant="primary" size="sm">View</Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
