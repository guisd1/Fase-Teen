import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/stores";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(getStore().pages).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = getStore();
  const page = store.pages[(await params).slug];
  return page ? { title: `${page.title} | ${store.name}` } : {};
}

export default async function InstitutionalPage({ params }: Props) {
  const page = getStore().pages[(await params).slug];
  if (!page) notFound();
  return (
    <main className="institutional">
      <h1>{page.title}</h1>
      {page.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      <Link className="text-link" href="/">← Voltar para a loja</Link>
    </main>
  );
}
