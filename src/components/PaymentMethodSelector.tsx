'use client';

import React, { useState } from 'react';

interface PaymentOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (value: string) => void;
  className?: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'google',
    label: 'Google Pay',
    value: 'google',
    icon: (
      <svg fill="currentColor" viewBox="0 0 32 32" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
        <path d="M32 13.333l-4.177 9.333h-1.292l1.552-3.266-2.75-6.068h1.359l1.99 4.651h0.026l1.927-4.651zM14.646 16.219v3.781h-1.313v-9.333h3.474c0.828-0.021 1.63 0.266 2.25 0.807 0.615 0.505 0.953 1.219 0.943 1.974 0.010 0.766-0.339 1.5-0.943 1.979-0.604 0.531-1.354 0.792-2.25 0.792zM14.641 11.818v3.255h2.198c0.484 0.016 0.958-0.161 1.297-0.479 0.339-0.302 0.526-0.714 0.526-1.141 0-0.432-0.188-0.844-0.526-1.141-0.349-0.333-0.818-0.51-1.297-0.495zM22.63 13.333c0.833 0 1.495 0.234 1.979 0.698s0.724 1.099 0.724 1.906v3.859h-1.083v-0.87h-0.047c-0.469 0.714-1.089 1.073-1.865 1.073-0.667 0-1.219-0.203-1.667-0.615-0.438-0.385-0.682-0.948-0.672-1.531 0-0.646 0.234-1.161 0.708-1.547 0.469-0.38 1.099-0.573 1.885-0.573 0.672 0 1.224 0.13 1.656 0.385v-0.271c0.005-0.396-0.167-0.776-0.464-1.042-0.297-0.276-0.688-0.432-1.094-0.427-0.63 0-1.13 0.276-1.5 0.828l-0.995-0.646c0.547-0.818 1.359-1.229 2.432-1.229zM21.167 17.88c-0.005 0.302 0.135 0.583 0.375 0.766 0.25 0.203 0.563 0.313 0.88 0.307 0.474 0 0.932-0.198 1.271-0.547 0.359-0.333 0.563-0.802 0.563-1.292-0.354-0.292-0.844-0.438-1.474-0.438-0.464 0-0.844 0.115-1.151 0.344-0.307 0.234-0.464 0.516-0.464 0.859zM5.443 10.667c1.344-0.016 2.646 0.479 3.641 1.391l-1.552 1.521c-0.568-0.526-1.318-0.813-2.089-0.797-1.385 0.005-2.609 0.891-3.057 2.198-0.229 0.661-0.229 1.38 0 2.042 0.448 1.307 1.672 2.193 3.057 2.198 0.734 0 1.365-0.182 1.854-0.505 0.568-0.375 0.964-0.958 1.083-1.625h-2.938v-2.052h5.13c0.063 0.359 0.094 0.719 0.094 1.083 0 1.625-0.594 3-1.62 3.927-0.901 0.813-2.135 1.286-3.604 1.286-2.047 0.010-3.922-1.125-4.865-2.938-0.771-1.505-0.771-3.286 0-4.792 0.943-1.813 2.818-2.948 4.859-2.938z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple Pay',
    value: 'apple',
    icon: (
      <svg fill="currentColor" viewBox="0 0 640 512" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
        <path d="M116.9 158.5c-7.5 8.9-19.5 15.9-31.5 14.9-1.5-12 4.4-24.8 11.3-32.6 7.5-9.1 20.6-15.6 31.3-16.1 1.2 12.4-3.7 24.7-11.1 33.8m10.9 17.2c-17.4-1-32.3 9.9-40.5 9.9-8.4 0-21-9.4-34.8-9.1-17.9.3-34.5 10.4-43.6 26.5-18.8 32.3-4.9 80 13.3 106.3 8.9 13 19.5 27.3 33.5 26.8 13.3-.5 18.5-8.6 34.5-8.6 16.1 0 20.8 8.6 34.8 8.4 14.5-.3 23.6-13 32.5-26 10.1-14.8 14.3-29.1 14.5-29.9-.3-.3-28-10.9-28.3-42.9-.3-26.8 21.9-39.5 22.9-40.3-12.5-18.6-32-20.6-38.8-21.1m100.4-36.2v194.9h30.3v-66.6h41.9c38.3 0 65.1-26.3 65.1-64.3s-26.4-64-64.1-64h-73.2zm30.3 25.5h34.9c26.3 0 41.3 14 41.3 38.6s-15 38.8-41.4 38.8h-34.8V165zm162.2 170.9c19 0 36.6-9.6 44.6-24.9h.6v23.4h28v-97c0-28.1-22.5-46.3-57.1-46.3-32.1 0-55.9 18.4-56.8 43.6h27.3c2.3-12 13.4-19.9 28.6-19.9 18.5 0 28.9 8.6 28.9 24.5v10.8l-37.8 2.3c-35.1 2.1-54.1 16.5-54.1 41.5.1 25.2 19.7 42 47.8 42zm8.2-23.1c-16.1 0-26.4-7.8-26.4-19.6 0-12.3 9.9-19.4 28.8-20.5l33.6-2.1v11c0 18.2-15.5 31.2-36 31.2zm102.5 74.6c29.5 0 43.4-11.3 55.5-45.4L640 193h-30.8l-35.6 115.1h-.6L537.4 193h-31.6L557 334.9l-2.8 8.6c-4.6 14.6-12.1 20.3-25.5 20.3-2.4 0-7-.3-8.9-.5v23.4c1.8.4 9.3.7 11.6.7z" />
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Credit Card',
    value: 'card',
    icon: (
      <svg fill="currentColor" height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M22 4H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H2V10h20v10zm0-12H2V6h20v2z" />
      </svg>
    ),
  },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white">Payment Method</h4>
        <p className="text-xs text-neutral-500 mt-0.5">Choose your preferred way to pay</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Choose your payment method</legend>
        {paymentOptions.map((option) => {
          const isChecked = selectedMethod === option.value;
          return (
            <label
              key={option.id}
              className={`
                group relative flex w-full cursor-pointer items-center justify-between
                overflow-hidden rounded-xl border p-3.5
                transition-all duration-300 ease-out
                ${isChecked
                  ? 'border-[#10b981]/50 bg-[#10b981]/10'
                  : 'border-white/8 bg-[#1a1a1a]/60 hover:border-white/15 hover:bg-[#1a1a1a]'
                }
              `}
              aria-label={`Select ${option.label} as payment method`}
            >
              <div className="relative flex items-center gap-3">
                <div className={`
                  flex h-9 w-9 items-center justify-center rounded-lg
                  transition-all duration-300
                  ${isChecked
                    ? 'text-[#10b981]'
                    : 'text-neutral-400 group-hover:text-neutral-300'
                  }
                `}>
                  {option.icon}
                </div>

                <span className={`
                  text-sm font-medium transition-all duration-300
                  ${isChecked ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-300'}
                `}>
                  {option.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Animated check/radio indicator */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${isChecked
                    ? 'border-[#10b981] bg-[#10b981]'
                    : 'border-neutral-600 group-hover:border-neutral-500'
                  }
                `}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <input
                type="radio"
                name="payment-method"
                value={option.value}
                checked={isChecked}
                onChange={(e) => onMethodChange(e.target.value)}
                className="sr-only"
                aria-describedby={`${option.id}-description`}
              />

              <span id={`${option.id}-description`} className="sr-only">
                Pay with {option.label}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
};

export default PaymentMethodSelector;
