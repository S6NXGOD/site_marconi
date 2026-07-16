"use client";

import { toggleNewsPublish } from "@/app/admin/actions";

export default function PublishToggleButton({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const action = toggleNewsPublish.bind(null, id, !isPublished);
  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
          isPublished
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
        title={isPublished ? "Clique para despublicar" : "Clique para publicar"}
      >
        {isPublished ? "Publicada" : "Rascunho"}
      </button>
    </form>
  );
}
