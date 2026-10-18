import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import MediaCard from './MediaCard'
import { isImageUrl, isVideoUrl } from '../lib/format'
import { ExternalLink } from 'lucide-react'

function nodeText(node) {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (node?.props?.children != null) return nodeText(node.props.children)
  return ''
}

export default function Markdown({ children }) {
  const components = useMemo(
    () => ({
      pre({ children: ch, node, ...rest }) {
        let lang = ''
        let raw = ''
        const child = Array.isArray(ch) ? ch[0] : ch
        if (child?.props) {
          const cls = child.props.className || ''
          const m = cls.match(/language-([\w+#.-]+)/)
          if (m) lang = m[1]
          raw = nodeText(child.props.children)
        } else {
          raw = nodeText(ch)
        }
        return <CodeBlock code={raw} lang={lang} {...rest} />
      },
      code({ className, children: ch, node, ...rest }) {
        const isBlock = /language-/.test(className || '')
        if (isBlock) return <code {...rest}>{ch}</code>
        return (
          <code className="inline" {...rest}>
            {ch}
          </code>
        )
      },
      img({ src, alt }) {
        return <MediaCard type="image" url={String(src || '')} alt={alt || ''} compact />
      },
      a({ href, children: ch }) {
        const url = String(href || '')
        if (isVideoUrl(url)) return <MediaCard type="video" url={url} compact />
        if (isImageUrl(url) && !/^#/i.test(url)) return <MediaCard type="image" url={url} compact />
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
            {ch}
            <ExternalLink size={12} className="opacity-60" />
          </a>
        )
      },
    }),
    []
  )

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={(u) => (/^\s*javascript:/i.test(u) ? '' : u)}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
