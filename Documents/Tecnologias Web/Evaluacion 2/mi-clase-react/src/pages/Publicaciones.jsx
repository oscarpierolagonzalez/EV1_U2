import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPost, getPosts, sendReaction } from '../services/postservice'

const inputClass =
  'w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20'

const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

const reactionTypes = [
  { type: 'like', label: 'Me gusta', emoji: '👍' },
  { type: 'love', label: 'Me encanta', emoji: '❤️' },
  { type: 'haha', label: 'Me divierte', emoji: '😂' },
  { type: 'wow', label: 'Me sorprende', emoji: '😮' },
  { type: 'sad', label: 'Me entristece', emoji: '😢' },
  { type: 'angry', label: 'Me enoja', emoji: '😡' },
]

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Fecha desconocida'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida'

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getReactionCounts(reactions) {
  if (Array.isArray(reactions)) {
    return reactions.reduce((counts, reaction) => {
      if (reaction?.type) {
        counts[reaction.type] = (counts[reaction.type] || 0) + 1
      }
      return counts
    }, {})
  }

  if (reactions && typeof reactions === 'object') {
    return reactions
  }

  return {}
}

function Publicaciones() {
  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState(false)
  const [requiereRegistro, setRequiereRegistro] = useState(false)
  const [reaccionando, setReaccionando] = useState({})
  const [erroresReaccion, setErroresReaccion] = useState({})

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch((err) => setError(err.message || 'No se pudieron cargar las publicaciones'))
      .finally(() => setCargando(false))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')
    setRequiereRegistro(false)

    const token = localStorage.getItem('token')
    if (!token) {
      setFeedbackError(true)
      setRequiereRegistro(true)
      setFeedback('Debes registrarte antes de crear una publicación.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setFeedbackError(true)
      setFeedback('Completa el título y el contenido.')
      return
    }

    setEnviando(true)
    try {
      const post = await createPost(
        { title: trimmedTitle, content: trimmedContent },
        token,
      )
      setPosts((currentPosts) => [post, ...currentPosts])
      setTitle('')
      setContent('')
      setFeedbackError(false)
      setFeedback('Publicación creada correctamente.')
    } catch (err) {
      setFeedbackError(true)
      setFeedback(err.message || 'No se pudo crear la publicación.')
    } finally {
      setEnviando(false)
    }
  }

  const handleReaction = async (postId, type) => {
    const key = `${postId}:${type}`
    if (reaccionando[key]) return

    setErroresReaccion((current) => ({ ...current, [postId]: null }))
    setReaccionando((current) => ({ ...current, [key]: true }))

    try {
      const storedUser = localStorage.getItem('user')
      let userId
      if (storedUser) {
        try {
          userId = JSON.parse(storedUser)?.id
        } catch {
          throw new Error('No se pudo leer la sesión guardada. Vuelve a registrarte.')
        }
      }

      const { counts } = await sendReaction(postId, { type, userId })
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, reactions: counts } : post,
        ),
      )
    } catch (err) {
      setErroresReaccion((current) => ({
        ...current,
        [postId]: {
          warning: err.status === 409,
          message:
            err.status === 409
              ? 'Ya reaccionaste a esta publicación con este tipo. Puedes elegir otra reacción.'
              : err.message || 'No se pudo registrar la reacción.',
        },
      }))
    } finally {
      setReaccionando((current) => ({ ...current, [key]: false }))
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Publicaciones</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Comparte una pregunta o una idea con tu clase.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            placeholder="Escribe el título"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className={labelClass}>
            Contenido
          </label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={inputClass}
            placeholder="Escribe el contenido de tu publicación"
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Publicando...' : 'Crear publicación'}
        </button>

        {feedback && (
          <p
            aria-live="polite"
            className={`rounded-xl px-4 py-3 text-sm ${
              feedbackError
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback}
            {requiereRegistro && (
              <>
                {' '}
                <Link to="/registrarme" className="font-semibold underline">
                  Regístrate aquí.
                </Link>
              </>
            )}
          </p>
        )}
      </form>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
          Todas las publicaciones <span className="text-sm font-normal text-neutral-500">({posts.length})</span>
        </h2>
        {cargando && <p className="text-sm text-neutral-500">Cargando publicaciones...</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {posts.length === 0 ? (
          !cargando && !error && (
            <p className="text-sm text-neutral-500">Aún no hay publicaciones.</p>
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="min-w-0 break-words font-semibold text-neutral-900">
                    {post.title}
                  </h3>
                  <time
                    className="text-xs text-neutral-500"
                    dateTime={post.createdAt || undefined}
                  >
                    {formatCreatedAt(post.createdAt)}
                  </time>
                </header>
                <p className="mt-1 text-sm font-medium text-violet-700">
                  Por {post.author?.name || 'Autor desconocido'}
                </p>
                <p className="mt-2 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-600">
                  {post.content}
                </p>
                <div
                  className="mt-4 border-t border-neutral-100 pt-3"
                  aria-label="Reacciones"
                >
                  <div className="flex flex-wrap gap-2">
                    {reactionTypes.map(({ type, label, emoji }) => {
                      const key = `${post.id}:${type}`
                      const count = getReactionCounts(
                        post.reactions ?? post.reactionCounts,
                      )[type] || 0

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleReaction(post.id, type)}
                          disabled={reaccionando[key]}
                          aria-label={`${label}: ${count}`}
                          title={label}
                          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-wait disabled:opacity-60"
                        >
                          <span aria-hidden="true">{emoji}</span>
                          <span>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                  {erroresReaccion[post.id] && (
                    <p
                      className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                        erroresReaccion[post.id].warning
                          ? 'border border-amber-200 bg-amber-50 text-amber-800'
                          : 'border border-red-200 bg-red-50 text-red-700'
                      }`}
                      role={erroresReaccion[post.id].warning ? 'status' : 'alert'}
                      aria-live="polite"
                    >
                      {erroresReaccion[post.id].message}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Publicaciones