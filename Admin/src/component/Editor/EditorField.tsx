import { useEffect, useRef } from "react";
import type EditorJS from "@editorjs/editorjs";

interface EditorFieldProps {
  holder: string;
  initialData?: Record<string, unknown> | null;
  onReady: (editor: EditorJS) => void;
  placeholder?: string;
  error?: string;
}

const EditorField = ({ holder, initialData, onReady, placeholder, error }: EditorFieldProps) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initEditor = async () => {
      const { default: EditorJS } = await import("@editorjs/editorjs");
      const { default: Header } = await import("@editorjs/header");
      const { default: List } = await import("@editorjs/list");
      const { default: Paragraph } = await import("@editorjs/paragraph");
      const { default: Quote } = await import("@editorjs/quote");
      const { default: Checklist } = await import("@editorjs/checklist");
      const { default: Delimiter } = await import("@editorjs/delimiter");
      const { default: InlineCode } = await import("@editorjs/inline-code");
      const { default: CodeTool } = await import("@editorjs/code");
      const { default: Table } = await import("@editorjs/table");
      const { default: Embed } = await import("@editorjs/embed");

      if (cancelled) return;

      const editor = new EditorJS({
        holder,
        tools: {
          header: { class: Header as any, inlineToolbar: true, config: { levels: [1, 2, 3, 4, 5, 6], defaultLevel: 2 } },
          list: { class: List as any, inlineToolbar: true },
          paragraph: { class: Paragraph as any, inlineToolbar: true },
          quote: { class: Quote as any, inlineToolbar: true },
          checklist: { class: Checklist as any, inlineToolbar: true },
          delimiter: Delimiter as any,
          inlineCode: InlineCode as any,
          code: CodeTool as any,
          table: { class: Table as any, inlineToolbar: true },
          embed: { class: Embed as any, inlineToolbar: true },
        },
        placeholder: placeholder || "Start writing...",
        data: (initialData && Object.keys(initialData).length > 0) ? initialData as any : undefined,
        onReady: () => {
          if (!cancelled) {
            editorRef.current = editor;
            onReady(editor);
          }
        },
      });
    };

    initEditor();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch {}
        editorRef.current = null;
      }
    };
  }, [holder]);

  return (
    <div className="w-full">
      <div
        id={holder}
        className={`w-full border bg-white rounded-lg px-4 text-[13px] focus:outline-none editor-js-wrapper ${error ? "border-red-500" : "border-[#364B9B66]"}`}
      />
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
};

export default EditorField;
