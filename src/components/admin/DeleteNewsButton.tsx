"use client";

import { useFormStatus } from "react-dom";
import { deleteNews } from "@/app/admin/actions";

function ConfirmSubmit({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Excluir a notícia "${title}"? Esta ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
      </svg>
      {pending ? "..." : "Excluir"}
    </button>
  );
}

export default function DeleteNewsButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  // Server action com o id "amarrado".
  const action = deleteNews.bind(null, id);
  return (
    <form action={action}>
      <ConfirmSubmit title={title} />
    </form>
  );
}
