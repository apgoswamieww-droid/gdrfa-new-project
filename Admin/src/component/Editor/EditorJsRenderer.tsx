interface EditorJsBlock {
  type: string;
  data: Record<string, any>;
}

interface EditorJsRendererProps {
  data: string | null | undefined;
}

const BlockRenderer = ({ block }: { block: EditorJsBlock }) => {
  switch (block.type) {
    case "header": {
      const level = block.data.level || 2;
      const Tag = `h${level}` as any;
      return <Tag className="font-bold text-secondary mb-2" style={{ fontSize: `${1.6 - level * 0.15}rem` }}>{block.data.text}</Tag>;
    }
    case "paragraph":
      return <p className="text-gray-700 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
    case "list": {
      const ListTag = block.data.style === "ordered" ? "ol" : "ul";
      return (
        <ListTag className={`mb-3 pl-5 ${block.data.style === "ordered" ? "list-decimal" : "list-disc"} text-gray-700 space-y-1`}>
          {block.data.items?.map((item: string, i: number) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-4 border-[#364B9B] pl-4 py-2 mb-3 italic text-gray-600 bg-gray-50 rounded-r-xl">
          <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
          {block.data.caption && <cite className="text-sm text-gray-400 not-italic mt-1 block">— {block.data.caption}</cite>}
        </blockquote>
      );
    case "checklist":
      return (
        <ul className="mb-3 space-y-1">
          {block.data.items?.map((item: { text: string; checked: boolean }, i: number) => (
            <li key={i} className="flex items-center gap-2 text-gray-700">
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${item.checked ? "bg-[#364B9B] border-[#364B9B] text-white" : "border-gray-300"}`}>
                {item.checked ? "✓" : ""}
              </span>
              <span dangerouslySetInnerHTML={{ __html: item.text }} />
            </li>
          ))}
        </ul>
      );
    case "delimiter":
      return <hr className="my-4 border-gray-200" />;
    case "inline-code":
    case "code":
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl mb-3 overflow-x-auto text-sm">
          <code>{block.data.code || block.data.text}</code>
        </pre>
      );
    case "table":
      return (
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-gray-200">
            <tbody>
              {block.data.content?.map((row: string[], ri: number) => (
                <tr key={ri} className={ri === 0 ? "bg-gray-50 font-semibold" : ""}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} className="border border-gray-200 px-3 py-2 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cell }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "embed":
      return (
        <div className="mb-3">
          <div className="aspect-video">
            <iframe
              src={block.data.embed}
              className="w-full h-full rounded-xl"
              allowFullScreen
              title={block.data.caption || "Embedded content"}
            />
          </div>
          {block.data.caption && <p className="text-sm text-gray-400 mt-1 text-center">{block.data.caption}</p>}
        </div>
      );
    default:
      return null;
  }
};

const EditorJsRenderer = ({ data }: EditorJsRendererProps) => {
  if (!data) return <p className="text-gray-400 italic">No content</p>;

  let parsed: { blocks?: EditorJsBlock[] } | null = null;
  try {
    parsed = JSON.parse(data);
  } catch {
    return <p className="text-gray-700 whitespace-pre-wrap">{data}</p>;
  }

  if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    return <p className="text-gray-400 italic">No content</p>;
  }

  return (
    <div className="prose prose-sm max-w-none">
      {parsed.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
};

export default EditorJsRenderer;
