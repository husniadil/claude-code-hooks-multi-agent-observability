import MarkdownIt from 'markdown-it';

// Shared, configured instance. `html: false` escapes any raw HTML in the
// transcript (so embedded tags like <command-name> render as literal text and
// there's no XSS surface); markdown-it also blocks javascript:/data: links by
// default. `breaks: true` keeps single newlines as <br>, matching the old
// whitespace-pre-wrap feel.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

// Open links in a new tab so clicking a transcript link doesn't navigate the
// dashboard away; rel guards against tab-nabbing / SEO leakage.
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener nofollow');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export const renderMarkdown = (text: string): string => md.render(text ?? '');
