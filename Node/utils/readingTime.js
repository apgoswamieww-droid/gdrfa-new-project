// utils/readingTime.js
function stripHtml(html) {
    return html.replace(/<[^>]+>/g, "");
}

function getReadingTime(editorJsContent, wpm = 200) {
    if (!editorJsContent || !editorJsContent.blocks) return { minutes: 0, text: "0 min read" };

    let text = "";

    editorJsContent.blocks.forEach(block => {
        if (block.type === "paragraph" || block.type === "header") {
            text += " " + stripHtml(block.data.text);
        }
        if (block.type === "list") {
            text += " " + block.data.items.map(item => stripHtml(item)).join(" ");
        }
    });

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / wpm);

    let formatted = minutes < 60 
        ? `${minutes} min read` 
        : `${Math.floor(minutes/60)} hr ${minutes % 60} min read`;

    return { words, minutes, text: formatted };
}

module.exports = getReadingTime;
