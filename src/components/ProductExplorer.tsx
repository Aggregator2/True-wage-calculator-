'use client';

import { useState, useMemo } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { UK_PRODUCTS as PRODUCTS } from '@/lib/products';
import { formatHours } from '@/lib/calculator';
import type { ProductCategory } from '@/types/calculator';

const CATEGORIES: { key: ProductCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food & Drink' },
  { key: 'tech', label: 'Tech' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'transport', label: 'Transport' },
  { key: 'home', label: 'Home' },
  { key: 'lifestyle', label: 'Lifestyle' },
];

export default function ProductExplorer() {
  const { results } = useCalculatorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [customAmount, setCustomAmount] = useState(100);
  const [showCount, setShowCount] = useState(12);

  const trueHourlyRate = results?.trueHourlyRate || 10;

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const visibleProducts = filteredProducts.slice(0, showCount);
  const hasMore = filteredProducts.length > showCount;

  const calculateHours = (price: number, period?: 'month' | 'year'): number => {
    const annualPrice = period === 'month' ? price * 12 : period === 'year' ? price : price;
    return annualPrice / trueHourlyRate;
  };

  const customHours = customAmount / trueHourlyRate;

  return (
    <section id="products" className="py-16 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Cost in Your Time</h2>
          <p className="text-neutral-400">See how many hours of your life common purchases really cost</p>
        </div>

        <div className="card p-6 md:p-8">
          {/* Custom Amount */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 pb-8 border-b border-white/5">
            <div className="flex-1">
              <label className="block text-sm text-neutral-400 mb-2">Enter any amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">£</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  className="input-field w-full pl-9 pr-4 py-4 text-xl"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-neutral-400 mb-2">Hours of your life</label>
              <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl px-6 py-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#10b981]">{formatHours(customHours)}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="search-input flex items-center px-4 py-3">
              <svg className="w-5 h-5 text-neutral-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, subscriptions, purchases..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visibleProducts.map((product, index) => {
              const hours = calculateHours(product.price, product.period);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCustomAmount(product.price)}
                  className="product-item p-4 text-left"
                >
                  <div className="text-2xl mb-2">{product.emoji}</div>
                  <p className="text-sm font-medium text-white truncate">{product.name}</p>
                  <p className="text-xs text-neutral-500 mb-2">
                    £{product.price.toLocaleString()}{product.period ? `/${product.period}` : ''}
                  </p>
                  <p className="text-sm font-semibold text-[#10b981]">{formatHours(hours)}</p>
                </button>
              );
            })}
          </div>

          {/* Show More */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowCount((prev) => prev + 12)}
              className="btn-secondary w-full mt-6 py-3"
            >
              Show More Products
            </button>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              No products found matching your search
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
