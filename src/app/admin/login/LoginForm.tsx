"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="admin-form">
      <label>E-mail
        <input name="email" type="email" required autoComplete="username" autoFocus={!state} defaultValue={state?.email} key={state?.email} />
      </label>
      <label>Senha
        <input name="password" type="password" required autoComplete="current-password" autoFocus={Boolean(state)} />
      </label>
      {state?.error && <p className="admin-error">{state.error}</p>}
      <button className="btn btn-dark full" type="submit" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
