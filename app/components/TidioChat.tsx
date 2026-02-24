'use client';

import { useEffect } from 'react';

export default function TidioChat() {
  useEffect(() => {
    const script = document.createElement('script');
    const tidioId = process.env.NEXT_PUBLIC_TIDIO_ID ?? 'YOUR_WEBSITE_ID';
    script.src = `https://code.tidio.co/${tidioId}.js`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const tidioScript = document.querySelector('script[src*="tidio"]');
      if (tidioScript) {
        tidioScript.remove();
      }
    };
  }, []);

  return null;
}
