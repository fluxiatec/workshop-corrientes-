import type { Metadata } from "next";
import { QrView } from "./qr-view";

export const metadata: Metadata = {
  title: "QR · ¿Qué tarea te gustaría delegar?",
};

export default function QrPage() {
  return <QrView />;
}
