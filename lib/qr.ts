"use client";

import QRCode from "qrcode";

const qrOptions = {
  errorCorrectionLevel: "M" as const,
  margin: 4, // zona de silencio estándar: clave para leer desde lejos
  color: { dark: "#000000", light: "#ffffff" },
};

export const participateUrl = (siteUrl: string) => `${siteUrl}/participar`;

export const qrSvg = (text: string) => QRCode.toString(text, { ...qrOptions, type: "svg" });

export const qrPngDataUrl = (text: string, width = 1600) =>
  QRCode.toDataURL(text, { ...qrOptions, type: "image/png", width });
