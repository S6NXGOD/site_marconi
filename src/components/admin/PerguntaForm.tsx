"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { PerguntaFormState } from "@/app/admin/perguntas/actions";

type Props = {
  action: (s: PerguntaFormState, f: FormData) => Promise<PerguntaFormState>;
  initial?: { question: string; answer: string; isActive: boolean };
  submitLabel: string;
};

const initialState: PerguntaFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:opacity-70"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

/** "123/200" — fica vermelho quando passa do limite. */
function Contador({ atual, limite }: { atual: number; limite: number }) {
  return (
    <span className={`text-xs tabular-nums ${atual > limite ? "font-semibold text-red-600" : "text-slate-500"}`}>
      {atual.toLocaleString("pt-BR")}/{limite.toLocaleString("pt-BR")}
    </span>
  );
}

export default function PerguntaForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [pergunta, setPergunta] = useState(initial?.question ?? "");
  const [resposta, setResposta] = useState(initial?.answer ?? "");

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-end justify-between gap-3">
          <label htmlFor="question" className="block text-sm font-medium text-conplan">
            Pergunta
          </label>
          <Contador atual={pergunta.length} limite={200} />
        </div>
        <input
          id="question"
          name="question"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Como falo com um especialista?"
          className={fieldClass}
        />
        {state.errors?.question && <p className="mt-1 text-xs text-red-600">{state.errors.question}</p>}
        <p className="mt-1 text-xs text-slate-500">
          Do jeito que o cliente perguntaria — é assim que ele procura no Google.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-end justify-between gap-3">
          <label htmlFor="answer" className="block text-sm font-medium text-conplan">
            Resposta
          </label>
          <Contador atual={resposta.length} limite={2000} />
        </div>
        <textarea
          id="answer"
          name="answer"
          rows={7}
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          placeholder="Pelo botão do WhatsApp no canto da tela ou pelo e-mail contato@marconinunes.com.br."
          className={`${fieldClass} resize-y leading-relaxed`}
        />
        {state.errors?.answer && <p className="mt-1 text-xs text-red-600">{state.errors.answer}</p>}
        <p className="mt-1 text-xs text-slate-500">
          Uma linha em branco separa parágrafos. E-mails e links (https://…) viram link sozinhos.
          Respostas curtas funcionam melhor — as IAs de busca citam a primeira frase.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cloud px-4 py-3">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
        />
        <span className="text-sm font-medium text-conplan">Exibir no site</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/perguntas"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
