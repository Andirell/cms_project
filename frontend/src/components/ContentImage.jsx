import { Compass } from 'lucide-react';
import { assetUrl } from '../lib/api.js';

// Shows a plain blueprint panel when no image has been uploaded, not a stock photo.
export default function ContentImage({ src, alt = '', className = '' }) {
  if (!src) {
    return (
      <div className={`blueprint-grid flex items-center justify-center text-white/60 ${className}`}>
        <Compass size={40} aria-hidden="true" />
      </div>
    );
  }

  return <img src={assetUrl(src)} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
