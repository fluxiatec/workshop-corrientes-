import type { Metadata, Viewport } from "next";
import { CasesBoard } from "./cases-board";

export const metadata: Metadata = {
  title: "Casos de hoy · Workshop",
};

export const viewport: Viewport = {
  themeColor: "#190019",
};

export default function CasosPage() {
  return <CasesBoard />;
}
