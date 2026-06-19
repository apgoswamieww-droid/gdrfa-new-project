import { useState, useRef, useEffect } from "react";
import { getTagsListApi } from "../../api/blog.api";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

const TagsInput = ({ value, onChange, placeholder, error }: TagsInputProps) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTagsListApi().then(res => {
      if (res.status && res.data) {
        setAllTags(res.data.map((t: any) => t.name));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = allTags.filter(
    t => t.toLowerCase().includes(input.toLowerCase()) && !value.includes(t)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      <div
        className={`flex flex-wrap gap-1 w-full border bg-white rounded-lg px-2.5 py-1.5 text-[13px] focus-within:outline-none cursor-text ${error ? "border-red-500" : "border-[#364B9B66]"}`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 bg-[#364B9B]/10 text-[#364B9B] text-[11px] font-medium px-2 py-0.5 rounded-md">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(i); }} className="hover:text-red-500 transition-colors leading-none">&times;</button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? (placeholder || "Type and press Enter to add tags") : ""}
          className="flex-1 min-w-[120px] outline-none text-[13px] bg-transparent"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-auto min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-2.5 py-1.5 text-[13px] hover:bg-gray-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
};

export default TagsInput;
