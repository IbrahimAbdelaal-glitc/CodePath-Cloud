import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock.jsx';

// Safe Markdown: react-markdown never renders raw HTML and strips dangerous (javascript:) links
const components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;
    const className = child?.props?.className || '';
    const language = /language-([\w#+-]+)/.exec(className)?.[1];
    const code = String(child?.props?.children ?? '').replace(/\n$/, '');
    return <CodeBlock code={code} language={language} />;
  },
  code({ children }) {
    return (
      <code className="inline-code" dir="ltr">
        {children}
      </code>
    );
  },
  a({ href, children }) {
    const external = /^https?:\/\//.test(href || '');
    return (
      <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="table-wrap" tabIndex={0}>
        <table>{children}</table>
      </div>
    );
  },
};

export default function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
