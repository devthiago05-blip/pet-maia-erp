import { MapPinned } from "lucide-react";

interface MapsRouteLinkProps {
  address?: string | null;
  className?: string;
  compact?: boolean;
}

export function getGoogleMapsRouteUrl(address: string) {
  const destination = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

export function MapsRouteLink({
  address,
  className = "",
  compact = false,
}: MapsRouteLinkProps) {
  const normalizedAddress = address?.trim();

  if (!normalizedAddress) {
    return <span className={className}>-</span>;
  }

  return (
    <a
      href={getGoogleMapsRouteUrl(normalizedAddress)}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir rota no Google Maps"
      aria-label={`Abrir rota para ${normalizedAddress} no Google Maps`}
      className={`inline-flex max-w-full items-center gap-1.5 font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-900 ${className}`}
    >
      <MapPinned size={compact ? 14 : 16} className="shrink-0" />
      <span className={compact ? "truncate" : "break-words"}>
        {normalizedAddress}
      </span>
    </a>
  );
}
