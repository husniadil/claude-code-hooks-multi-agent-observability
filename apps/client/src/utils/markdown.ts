import MarkdownIt from 'markdown-it';

// Shared, configured instance. `html: false` escapes any raw HTML in the
// transcript (so embedded tags like <command-name> render as literal text and
// there's no XSS surface); markdown-it also blocks javascript:/data: links by
// default. `breaks: true` keeps single newlines as <br>, matching the old
// whitespace-pre-wrap feel.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

export const renderMarkdown = (text: string): string => md.render(text ?? '');
