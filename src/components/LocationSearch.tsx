'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Location, ALL_LOCATIONS, LocationType } from '@/lib/locations-data';

interface LocationSearchProps {
  value: string;
  onChange: (locationId: string) => void;
  label?: string;
  placeholder?: string;
  excludeId?: string; // Exclude this location from results (e.g., for target selection)
}

const REGION_LABELS: Record<LocationType, string> = {
  uk: '🇬🇧 United Kingdom',
  europe: '🇪🇺 Europe',
  americas: '🌎 Americas',
  asia: '🌏 Asia',
  middle_east: '🌍 Middle East',
  oceania: '🌏 Oceania',
  africa: '🌍 Africa',
};

const REGION_ORDER: LocationType[] = ['uk', 'europe', 'americas', 'asia', 'middle_east', 'africa', 'oceania'];

export default function LocationSearch({
  value,
  onChange,
  label,
  placeholder = 'Search cities...',
  excludeId,
}: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLocation = ALL_LOCATIONS.find(l => l.id === value);

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let locations = ALL_LOCATIONS;

    if (excludeId) {
      locations = locations.filter(l => l.id !== excludeId);
    }

    if (!query) return locations;

    return locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.country.toLowerCase().includes(query) ||
      loc.popularFor.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, excludeId]);

  // Group by region
  const groupedLocations = useMemo(() => {
    const groups: Record<LocationType, Location[]> = {
      uk: [],
      europe: [],
      americas: [],
      asia: [],
      middle_east: [],
      oceania: [],
      africa: [],
    };

    filteredLocations.forEach(loc => {
      groups[loc.region].push(loc);
    });

    return groups;
  }, [filteredLocations]);

  // Flatten for keyboard navigation
  const flatList = useMemo(() => {
    const result: Location[] = [];
    REGION_ORDER.forEach(region => {
      result.push(...groupedLocations[region]);
    });
    return result;
  }, [groupedLocations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, flatList.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatList[highlightedIndex]) {
          onChange(flatList[highlightedIndex].id);
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      highlightedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleSelect = (locationId: string) => {
    onChange(locationId);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  let itemIndex = -1;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm text-neutral-400 mb-2">{label}</label>
      )}

      {/* Selected value display / Search input */}
      <div
        className={`input-field w-full px-4 py-3 cursor-pointer flex items-center gap-3 ${
          isOpen ? 'ring-2 ring-purple-500/50' : ''
        }`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-white placeholder-neutral-500"
            autoFocus
          />
        ) : selectedLocation ? (
          <>
            <span className="text-xl">{selectedLocation.flag}</span>
            <div className="flex-1">
              <span className="text-white">{selectedLocation.name}</span>
              <span className="text-neutral-500 ml-2 text-sm">{selectedLocation.country}</span>
            </div>
            {selectedLocation.digitalNomadVisa && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                DN Visa
              </span>
            )}
          </>
        ) : (
          <span className="text-neutral-500">{placeholder}</span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
        >
          {filteredLocations.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              No locations found for "{searchQuery}"
            </div>
          ) : (
            REGION_ORDER.map(region => {
              const locations = groupedLocations[region];
              if (locations.length === 0) return null;

              return (
                <div key={region}>
                  {/* Region header */}
                  <div className="px-4 py-2 bg-[#0f0f0f] text-xs font-medium text-neutral-500 sticky top-0">
                    {REGION_LABELS[region]} ({locations.length})
                  </div>

                  {/* Locations in region */}
                  {locations.map(loc => {
                    itemIndex++;
                    const isHighlighted = itemIndex === highlightedIndex;
                    const isSelected = loc.id === value;

                    return (
                      <div
                        key={loc.id}
                        data-index={itemIndex}
                        onClick={() => handleSelect(loc.id)}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-purple-500/20'
                            : isSelected
                            ? 'bg-purple-500/10'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl">{loc.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{loc.name}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-neutral-500 truncate">
                            {loc.country}
                            {loc.popularFor.length > 0 && (
                              <span className="ml-2 text-neutral-600">
                                • {loc.popularFor.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {loc.digitalNomadVisa && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              DN Visa
                            </span>
                          )}
                          {loc.incomeTaxRate === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                              Tax Free
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}

          {/* Quick tip */}
          {filteredLocations.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 text-xs text-neutral-600">
              💡 Try searching by city, country, or keywords like "beach", "tech", "tax free"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
