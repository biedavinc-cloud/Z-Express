import React from "react";
import BrandMark from '@/components/site/BrandMark';
import ImageBackdrop from '@/components/site/ImageBackdrop';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <ImageBackdrop
        interval={9000}
        overlayClassName="bg-gradient-to-b from-primary/80 via-primary/60 to-primary/85"
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mb-5 inline-flex justify-center">
            <BrandMark size="lg" variant="light" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary-foreground">{title}</h1>
          {subtitle && <p className="text-primary-foreground/70 mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-none shadow-xl border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-primary-foreground/70 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}