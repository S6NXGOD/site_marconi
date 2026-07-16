"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePassword, type PasswordState } from "@/app/admin/conta/actions";

const initialState: PasswordState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Salvando..." : "Alterar senha"}
    </button>
  );
}

export default function PasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.status !== "idle" && state.message && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            state.status === "success"
              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="current" className="mb-1.5 block text-sm font-medium text-conplan">
          Senha atual
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
        />
        {state.errors?.current && (
          <p className="mt-1 text-xs text-red-600">{state.errors.current}</p>
        )}
      </div>

      <div>
        <label htmlFor="next" className="mb-1.5 block text-sm font-medium text-conplan">
          Nova senha{" "}
          <span className="font-normal text-slate-400">(mín. 8 caracteres)</span>
        </label>
        <input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
        />
        {state.errors?.next && (
          <p className="mt-1 text-xs text-red-600">{state.errors.next}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-conplan">
          Confirmar nova senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
        />
        {state.errors?.confirm && (
          <p className="mt-1 text-xs text-red-600">{state.errors.confirm}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
