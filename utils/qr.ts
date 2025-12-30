
/**
 * Generates a simple QR Code SVG path or utilizes a reliable CDN-based generator for high performance.
 * We use a Google Chart API fallback for maximum reliability and zero bundle size.
 */
export const getQRCodeUrl = (data: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
};
