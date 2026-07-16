"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Star, Bookmark, ShoppingBag, ChevronDown } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
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

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBooks();
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

  async function fetchBooks() {
    try {
      const response = await fetch("/api/books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch("/api/book-categories?active=true");
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
            title="Barista Books"
            description="Curated professional library for serious baristas. Browse freely, purchase with account."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  const filtered = books.filter(
    (b) =>
      (category === "All" || b.category === category) &&
      b.title.toLowerCase().includes(search.toLowerCase())
  );

  const displayCategories = categories.slice(0, 4);
  const hasMoreCategories = categories.length > 4;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Marketplace"
          title="Barista Books"
          description="Curated professional library for serious baristas. Browse freely, purchase with account."
        />

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search books..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((book) => (
            <Card key={book.id} className="overflow-hidden p-0">
              <Link href={`/books/${book.id}`}>
                {book.cover ? (
                  <div className="relative h-56">
                    <Image src={book.cover} alt={book.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                  </div>
                ) : null}
                <div className="p-6">
                  <Badge variant="default" className="mb-2">{book.category}</Badge>
                  <CardTitle className="text-lg mb-1">{book.title}</CardTitle>
                  <p className="text-sm text-muted mb-3">by {book.author}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 fill-yellow text-yellow" />
                    <span className="text-sm font-medium">{book.rating}</span>
                    <span className="text-sm text-muted">({book.reviews} reviews)</span>
                  </div>
                  <p className="text-sm text-muted mb-4 line-clamp-2">{book.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green">{formatCurrency(book.price)}</span>
                    <Button variant="primary" size="sm">View</Button>
                  </div>
                </div>
              </Link>
              <div className="px-6 pb-6 pt-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      alert("Please login to purchase"); // TODO: Replace with in-app notification
                      return;
                    }
                    addToCart({
                      id: book.id,
                      type: "book",
                      title: book.title,
                      author: book.author,
                      price: book.price,
                      image: book.cover,
                    });
                    window.location.href = "/checkout";
                  }}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Purchase Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
