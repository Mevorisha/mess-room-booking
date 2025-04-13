export function urlObjectCreateWrapper(blob: Blob, additonalTracking?: string): string {
  const url = URL.createObjectURL(blob);
  if (additonalTracking != null) console.trace("Created", url, additonalTracking);
  return url;
}

export function urlObjectRevokeWrapper(url: string, additonalTracking?: string): void {
  if (additonalTracking != null) console.trace("Revoked", url, additonalTracking);
  URL.revokeObjectURL(url);
}
