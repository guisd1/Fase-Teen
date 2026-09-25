"use client";

import { useState } from "react";

/** Exclusão em duas etapas, para evitar clique acidental. */
export default function DeleteButton({ action, label = "Excluir produto", warning = "Excluir de vez? As fotos também serão apagadas." }: {
  action: () => Promise<void>;
  label?: string;
  warning?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return <button className="btn btn-light admin-danger" type="button" onClick={() => setConfirming(true)}>{label}</button>;
  }
  return (
    <form action={action} className="admin-confirm">
      <span>{warning}</span>
      <button className="btn btn-dark admin-danger-solid" type="submit">Sim, excluir</button>
      <button className="btn btn-light" type="button" onClick={() => setConfirming(false)}>Cancelar</button>
    </form>
  );
}
