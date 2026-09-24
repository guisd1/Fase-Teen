import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getStore } from "@/stores";
import "./admin.css";

export function generateMetadata(): Metadata {
  return {
    title: `Painel | ${getStore().name}`,
    robots: { index: false, follow: false }
  };
}

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="admin">{children}</div>;
}
