import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Brain,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileArchive,
  ImagePlus,
  Loader2,
  Menu,
  Paperclip,
  RefreshCw,
  Send,
  Settings2,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import ModelPicker from '../components/ModelPicker'
import Markdown from '../components/Markdown'
import MediaCard from '../components/MediaCard'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { streamChat } from '../lib/api'
import { load, save, uid } from '../lib/storage'
import { estimateCost, fmtNum, fmtTime, fmtUSD, titleFromText } from '../lib/format'
import { downloadText, exportCodeBlocksZip, exportConversationZip } from '../lib/export'

const EMPTY = []

function newConvo(model) {
  return {
    id: uid(),
    title: 'Percakapan baru',
    model,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function Chat() {
  const { settings, setSetting, models, pushToast, modelsState, refreshModels } = useApp()
  const [convos, setConvos] = useState(() => load('convos', EMPTY))
  const [activeId, setActiveId] = useState(() => load('activeConvo', null))
  const [input, setInput] = useState('')
  const [images, setImages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [streamReasoning, setStreamReasoning] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showReasoning, setShowReasoning] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  const abortRef = useRef(null)
  const scrollRef = useRef(null)
  const taRef = useRef(null)
  const convosRef = useRef(convos)

  const active = useMemo(() => convos.find((c) => c.id === activeId) || null, [convos, activeId])

  /* persist */
  useEffect(() => {
    convosRef.current = convos
    save('convos', convos.slice(0, 50))
  }, [convos])
  useEffect(() => {
    save('activeConvo', activeId)
  }, [activeId])

  /* auto pilih percakapan */
  useEffect(() => {
    if (!activeId && convos.length) setActiveId(convos[0].id)
  }, [activeId, convos])

  /* scroll */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (streaming) scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamText, streamReasoning])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  /* percakapan CRUD */
  const newChat = () => {
    const c = newConvo(settings.model)
    setConvos((list) => [c, ...list])
    setActiveId(c.id)
    setSidebarOpen(false)
  }

  const deleteConvo = (id) => {
    setConvos((list) => list.filter((c) => c.id !== id))
    if (id === activeId) setActiveId(null)
    pushToast('Percakapan dihapus', 'info')
  }

  const renameConvo = (id, title) => {
    setConvos((list) => list.map((c) => (c.id === id ? { ...c, title } : c)))
  }

  /* kirim */
  const send = async (text = input, attachImages = images) => {
    const content = text.trim()
    if ((!content && !attachImages.length) || streaming) return

    let convo = activeId ? convosRef.current.find((c) => c.id === activeId) : null
    if (!convo) {
      convo = newConvo(settings.model)
      setConvos((list) => [convo, ...list])
      setActiveId(convo.id)
    }

    const userMsg = {
      id: uid(),
      role: 'user',
      content,
      images: attachImages,
      ts: Date.now(),
    }

    const history = [...(convo.messages || []), userMsg]
      .filter((m) => !m.error && (m.content || m.images?.length))
      .map((m) => {
        if (m.images?.length && models.find((x) => x.id === (convo.model || settings.model))?.supports_vision) {
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content || 'Jelaskan gambar ini.' },
              ...m.images.map((img) => ({ type: 'image_url', image_url: { url: img.url } })),
            ],
          }
        }
        return { role: m.role, content: m.content }
      })

    const payload = []
    if (settings.systemPrompt?.trim()) payload.push({ role: 'system', content: settings.systemPrompt.trim() })
    payload.push(...history)

    setConvos((list) =>
      list.map((c) =>
        c.id === convo.id
          ? {
              ...c,
              title: c.messages.length ? c.title : titleFromText(content || 'Gambar'),
              messages: [...c.messages, userMsg],
              model: c.model || settings.model,
              updatedAt: Date.now(),
            }
          : c
      )
    )
    setInput('')
    setImages([])
    setStreamText('')
    setStreamReasoning('')
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    const model = convo.model || settings.model
    let acc = ''
    let accReasoning = ''
    let usage = null

    try {
      await streamChat({
        model,
        messages: payload,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        signal: controller.signal,
        onDelta: (d) => {
          acc += d
          setStreamText(acc)
        },
        onReasoning: (d) => {
          accReasoning += d
          setStreamReasoning(accReasoning)
        },
        onUsage: (u) => {
          usage = u
        },
        onError: (e) => {
          pushToast(e.message || 'Galat stream', 'error')
        },
        onDone: () => {
          const asst = {
            id: uid(),
            role: 'assistant',
            content: acc,
            reasoning: accReasoning,
            model,
            usage,
            ts: Date.now(),
            error: acc ? null : 'Respons kosong',
          }
          setConvos((list) =>
            list.map((c) =>
              c.id === convo.id ? { ...c, messages: [...c.messages, asst], updatedAt: Date.now() } : c
            )
          )
          setStreamText('')
          setStreamReasoning('')
          setStreaming(false)
          abortRef.current = null
        },
      })
    } catch (e) {
      if (e?.name !== 'AbortError') {
        pushToast(e.message || 'Gagal terhubung ke API', 'error')
        setConvos((list) =>
          list.map((c) =>
            c.id === convo.id
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { id: uid(), role: 'assistant', content: '', error: e.message || 'Gagal', ts: Date.now(), model },
                  ],
                  updatedAt: Date.now(),
                }
              : c
          )
        )
      } else if (acc) {
        setConvos((list) =>
          list.map((c) =>
            c.id === convo.id
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { id: uid(), role: 'assistant', content: acc, reasoning: accReasoning, model, usage, ts: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : c
          )
        )
      }
      setStreamText('')
      setStreamReasoning('')
      setStreaming(false)
      abortRef.current = null
    }
  }

  const stop = () => {
    abortRef.current?.abort()
  }

  const regenerate = async (msgIndex) => {
    if (streaming || !active) return
    const msgs = active.messages.slice(0, msgIndex)
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    setConvos((list) => list.map((c) => (c.id === active.id ? { ...c, messages: msgs } : c)))
    setTimeout(() => send(lastUser.content, lastUser.images || []), 120)
  }

  const addImages = async (files) => {
    const list = Array.from(files).slice(0, 4)
    for (const f of list) {
      if (f.size > 5 * 1024 * 1024) {
        pushToast(`${f.name} lebih dari 5MB`, 'error')
        continue
      }
      const url = await fileToDataUrl(f)
      setImages((imgs) => [...imgs, { url, name: f.name }].slice(0, 4))
    }
  }

  const modelObj = models.find((m) => m.id === (active?.model || settings.model))
  const canVision = !!modelObj?.supports_vision || (modelObj?.capabilities || []).includes('vision')

  const allMessages = active?.messages || []

  return (
    <div className="flex h-[calc(100vh-104px)] gap-0 px-4 pb-4 sm:px-6">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        convos={convos}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id)
          setSidebarOpen(false)
        }}
        onNew={newChat}
        onDelete={deleteConvo}
        onRename={renameConvo}
      />

      <main className="ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-line bg-cream-50/70 lg:ml-4">
        {/* header */}
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden" title="Riwayat">
            <Menu size={16} />
          </button>
          <ModelPicker
            value={active?.model || settings.model}
            onChange={(id) => {
              setSetting('model', id)
              if (active) setConvos((list) => list.map((c) => (c.id === active.id ? { ...c, model: id } : c)))
            }}
            className="w-[220px] sm:w-[280px]"
            compact
          />
          <div className="flex-1" />
          <button
            onClick={() => exportCodeBlocksZip(allMessages, 'kode.zip')}
            className="btn-icon hidden sm:inline-flex"
            title="Unduh semua kode (.zip)"
          >
            <FileArchive size={15} />
          </button>
          <button
            onClick={() => {
              if (active) exportConversationZip(active)
            }}
            className="btn-icon hidden sm:inline-flex"
            title="Unduh percakapan (.zip)"
          >
            <Download size={15} />
          </button>
          <button onClick={() => setSettingsOpen((s) => !s)} className="btn-icon" title="Setelan model">
            <Settings2 size={15} />
          </button>
          {allMessages.length > 0 && (
            <button
              onClick={() => {
                deleteConvo(active.id)
                setTimeout(newChat, 50)
              }}
              className="btn-icon hidden sm:inline-flex"
              title="Hapus percakapan"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* panel setelan */}
        {settingsOpen && (
          <div className="animate-fadeup border-b border-line bg-cream-200/50 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label-xs">Temperature: {settings.temperature}</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSetting('temperature', Number(e.target.value))}
                  className="mt-2"
                />
              </label>
              <label>
                <span className="label-xs">Maks token: {fmtNum(settings.maxTokens)}</span>
                <input
                  type="range"
                  min="256"
                  max="32768"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => setSetting('maxTokens', Number(e.target.value))}
                  className="mt-2"
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="label-xs">System prompt</span>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSetting('systemPrompt', e.target.value)}
                rows={2}
                className="field mt-1.5 !py-2.5 text-[13px]"
                placeholder="Instruksi sistem untuk model…"
              />
            </label>
            {modelsState.error && (
              <button onClick={refreshModels} className="mt-2 text-xs font-semibold text-err underline">
                Daftar model gagal dimuat — coba lagi
              </button>
            )}
          </div>
        )}

        {/* area pesan */}
        <div ref={scrollRef} onScroll={onScroll} className="chat-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {!allMessages.length && !streaming && (
            <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
              <div className="tile mb-5 !h-16 !w-16 !rounded-[22px]">
                <Send size={24} />
              </div>
              <h2 className="heading-2">
                Mulai percakapan.
                <br />
                <span className="text-muted-2">Semua model, satu ruang.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Streaming realtime, highlight kode otomatis, lampirkan gambar untuk model vision,
                dan ekspor hasil jadi ZIP kapan saja.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {[
                  'Buatkan landing page toko kopi',
                  'Jelaskan cara kerja SSE streaming',
                  'Buat script Python scrape harga',
                  'Ide caption Instagram produk',
                ].map((s) => (
                  <button key={s} onClick={() => send(s, [])} className="pill text-xs hover:shadow-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-5">
            {allMessages.map((m, idx) => (
              <MessageBubble
                key={m.id}
                msg={m}
                isLast={idx === allMessages.length - 1}
                onRegenerate={() => regenerate(idx)}
                canRegenerate={m.role === 'assistant' && !streaming}
                showReasoning={showReasoning}
                toggleReasoning={() => setShowReasoning((s) => !s)}
              />
            ))}

            {streaming && (
              <div className="animate-fadeup">
                {streamReasoning && (
                  <div className="mb-2 rounded-2xl border border-dashed border-line px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                      <Brain size={12} /> Alur pikir
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted-2">
                      {streamReasoning}
                    </p>
                  </div>
                )}
                <div className="card px-5 py-4">
                  {streamText ? (
                    <Markdown>{streamText}</Markdown>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={15} className="animate-spin" />
                      {streamReasoning ? 'Sedang berpikir…' : 'Menunggu respons…'}
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-blinkdot rounded-full bg-muted-2" />
                        <span className="h-1.5 w-1.5 animate-blinkdot rounded-full bg-muted-2" style={{ animationDelay: '0.2s' }} />
                        <span className="h-1.5 w-1.5 animate-blinkdot rounded-full bg-muted-2" style={{ animationDelay: '0.4s' }} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="relative border-t border-line px-4 pb-4 pt-3 sm:px-6">
          {!atBottom && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute -top-11 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-cream-50 px-3.5 py-2 text-xs font-semibold shadow-soft"
            >
              <ArrowDown size={13} /> Ke bawah
            </button>
          )}

          {images.length > 0 && (
            <div className="mb-2 flex gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.url} alt={img.name} className="h-14 w-14 rounded-xl border border-line object-cover" />
                  <button
                    onClick={() => setImages((x) => x.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-cream-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-[24px] border border-line bg-cream-100 p-2 focus-within:border-ink-800/25 focus-within:shadow-soft">
            <label className={`btn-icon mb-1 ml-1 ${canVision ? '' : 'opacity-40'}`} title={canVision ? 'Lampirkan gambar' : 'Model ini tidak support vision'}>
              <Paperclip size={15} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={!canVision}
                onChange={(e) => {
                  addImages(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder={canVision ? 'Tulis pesan… (Enter kirim, Shift+Enter baris baru)' : 'Tulis pesan… (Enter kirim)'}
              className="max-h-40 flex-1 bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-muted-2"
              style={{ minHeight: 44 }}
            />
            {streaming ? (
              <button onClick={stop} className="btn-dark mb-1 !rounded-[18px] !px-4 !py-3" title="Berhenti">
                <Square size={15} />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button onClick={() => send()} disabled={!input.trim() && !images.length} className="btn-dark mb-1 !rounded-[18px] !px-4 !py-3" title="Kirim">
                <ArrowUp size={16} />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[10.5px] text-muted-2">
            Streaming realtime dari API · {modelObj?.name || 'model belum dipilih'} · temp {settings.temperature} · maks {fmtNum(settings.maxTokens)} token
          </p>
        </div>
      </main>
    </div>
  )
}

/* ============================================================ */

function MessageBubble({ msg, isLast, onRegenerate, canRegenerate, showReasoning, toggleReasoning }) {
  const { pushToast, models } = useApp()
  const [showMore, setShowMore] = useState(false)
  const pricing = models.find((m) => m.id === msg.model)?.pricing

  const isUser = msg.role === 'user'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content || '')
      pushToast('Pesan disalin', 'success')
    } catch {
      pushToast('Gagal menyalin', 'error')
    }
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-2">
        {msg.images?.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {msg.images.map((img, i) => (
              <img key={i} src={img.url} alt={img.name} className="h-20 w-20 rounded-2xl border border-line object-cover" />
            ))}
          </div>
        )}
        {msg.content && (
          <div className="max-w-[85%] rounded-[22px] rounded-br-lg bg-ink-900 px-5 py-3.5 text-[15px] leading-relaxed text-cream-100">
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        )}
        <span className="px-1 text-[10px] text-muted-2">{fmtTime(msg.ts)}</span>
      </div>
    )
  }

  return (
    <div className="group/msg">
      {msg.reasoning && (
        <div className="mb-2 rounded-2xl border border-dashed border-line px-4 py-3">
          <button onClick={toggleReasoning} className="flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
            <span className="flex items-center gap-2">
              <Brain size={12} /> Alur pikir
            </span>
            <ChevronDown size={13} className={`transition-transform ${showReasoning ? 'rotate-180' : ''}`} />
          </button>
          {showReasoning && (
            <p className={`mt-1.5 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted-2 ${showMore ? '' : 'line-clamp-6'}`}>
              {msg.reasoning}
            </p>
          )}
          {showReasoning && msg.reasoning.length > 400 && (
            <button onClick={() => setShowMore((s) => !s)} className="mt-1 text-[11px] font-semibold text-muted underline">
              {showMore ? 'Ringkas' : 'Selengkapnya'}
            </button>
          )}
        </div>
      )}

      {msg.error ? (
        <div className="card border-err/40 bg-err/5 px-5 py-4">
          <p className="text-sm font-semibold text-err">Gagal: {msg.error}</p>
        </div>
      ) : (
        <div className="card px-5 py-4 sm:px-6 sm:py-5">
          <Markdown>{msg.content}</Markdown>
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10.5px] text-muted-2">
        <span className="font-mono">{msg.model || '—'}</span>
        {msg.usage && (
          <span>
            {fmtNum(msg.usage.prompt_tokens)}↑ / {fmtNum(msg.usage.completion_tokens)}↓ token
          </span>
        )}
        {msg.usage && pricing && <span>≈ {fmtUSD(estimateCost(msg.usage, pricing), 5)}</span>}
        <span>{fmtTime(msg.ts)}</span>
        <span className="flex items-center gap-2 opacity-0 transition-opacity group-hover/msg:opacity-100">
          <button onClick={copy} className="inline-flex items-center gap-1 hover:text-ink-900">
            <ClipboardCopy size={11} /> Salin
          </button>
          <button
            onClick={() => downloadText('pesan.md', msg.content || '', 'text/markdown')}
            className="inline-flex items-center gap-1 hover:text-ink-900"
          >
            <Download size={11} /> .md
          </button>
          {canRegenerate && (
            <button onClick={onRegenerate} className="inline-flex items-center gap-1 hover:text-ink-900">
              <RefreshCw size={11} /> Ulangi
            </button>
          )}
        </span>
      </div>
    </div>
  )
}
