import { redirect } from "next/navigation";
import { getStore } from "@/stores";
import { adminConfigured, adminHashValid, isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/produtos");
  const store = getStore();
  return (
    <main className="admin-login">
      <div className="admin-card">
        <p className="eyebrow">PAINEL DO ADMINISTRADOR</p>
        <h1>{store.name}</h1>
        {adminConfigured() && !adminHashValid() && (
          <p className="admin-alert">
            <code>ADMIN_PASSWORD_HASH</code> na Vercel não é um hash válido. Cole o código que começa com{" "}
            <code>scrypt:</code> gerado por <code>npm run admin:hash</code>, e não a senha. Depois faça o Redeploy.
          </p>
        )}
        {adminConfigured()
          ? <LoginForm />
          : <p className="admin-alert">
              Login ainda não configurado. Cadastre <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD_HASH</code> e{" "}
              <code>ADMIN_SESSION_SECRET</code> nas variáveis de ambiente (veja o README).
            </p>}
      </div>
    </main>
  );
}
