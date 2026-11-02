import { Mail, MapPin, Phone } from 'lucide-react';

// Each line only shows when the company has filled it in, so there are no empty links.
export default function ContactDetails({ profile }) {
  if (!profile?.phone && !profile?.email && !profile?.address) {
    return <p>Contact details will be added soon.</p>;
  }

  return (
    <div className="grid gap-3">
      {profile.phone ? (
        <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="flex min-h-6 items-center gap-3 hover:underline">
          <Phone size={17} aria-hidden="true" /> {profile.phone}
        </a>
      ) : null}
      {profile.email ? (
        <a href={`mailto:${profile.email}`} className="flex min-h-6 items-center gap-3 hover:underline">
          <Mail size={17} aria-hidden="true" /> {profile.email}
        </a>
      ) : null}
      {profile.address ? (
        <p className="flex items-center gap-3">
          <MapPin size={17} aria-hidden="true" /> {profile.address}
        </p>
      ) : null}
    </div>
  );
}
