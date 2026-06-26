'use client';

import { useEffect, useRef } from 'react';

interface WompiCheckoutButtonProps {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  integritySignature: string;
  redirectUrl: string;
}

export function WompiCheckoutButton({
  publicKey,
  currency,
  amountInCents,
  reference,
  integritySignature,
  redirectUrl,
}: WompiCheckoutButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.setAttribute('data-render', 'button');
    script.setAttribute('data-public-key', publicKey);
    script.setAttribute('data-currency', currency);
    script.setAttribute('data-amount-in-cents', String(amountInCents));
    script.setAttribute('data-reference', reference);
    script.setAttribute('data-signature:integrity', integritySignature);
    script.setAttribute('data-redirect-url', redirectUrl);
    container.appendChild(script);
  }, [publicKey, currency, amountInCents, reference, integritySignature, redirectUrl]);

  return <div ref={containerRef} />;
}
