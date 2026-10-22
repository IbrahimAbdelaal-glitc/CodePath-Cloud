import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import csharp from 'highlight.js/lib/languages/csharp';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { useI18n } from '../i18n/I18nContext.jsx';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('plaintext', plaintext);

const aliases = {
  js: 'javascript',
  jsx: 'javascript',
  html: 'xml',
  cs: 'csharp',
  'c#': 'csharp',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  text: 'plaintext',
};
const labels = { javascript: 'JavaScript', xml: 'HTML', css: 'CSS', csharp: 'C#', python: 'Python', bash: 'Terminal', json: 'JSON' };

function guessLanguage(code) {
  if (/^\s*</.test(code)) return 'xml';
  if (/\bdef |print\(|import \w+$|:\n\s{4}/m.test(code)) return 'python';
  if (/Console\.|public (class|record)|var \w+ = new|\bstring\b.*;|builder\./.test(code)) return 'csharp';
  if (/^\s*[.#][\w-]+\s*\{/m.test(code)) return 'css';
  return 'javascript';
}

// Syntax-highlighted code block with a copy button.
// highlightBlank: marks the ___ gap in "complete the code" questions.
export default function CodeBlock({ code, language, highlightBlank = false, label }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const lang = aliases[language] || language || guessLanguage(code);
  const resolved = hljs.getLanguage(lang) ? lang : 'plaintext';

  const html = useMemo(() => {
    // highlight.js output is HTML-escaped, so injecting it is safe
    let out = hljs.highlight(code, { language: resolved, ignoreIllegals: true }).value;
    if (highlightBlank) out = out.replace(/_{3,}/g, (m) => `<mark class="code-blank">${m}</mark>`);
    return out;
  }, [code, resolved, highlightBlank]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <figure className="code-block" dir="ltr">
      <figcaption className="code-block__bar">
        <span className="code-block__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="code-block__lang">{label || labels[resolved] || resolved}</span>
        <button type="button" className="code-block__copy" onClick={copy} aria-label={t('code.copy')}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{copied ? t('code.copied') : t('code.copyShort')}</span>
        </button>
      </figcaption>
      <pre tabIndex={0}>
        <code className={`hljs language-${resolved}`} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}
