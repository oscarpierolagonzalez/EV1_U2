const API_URL = import.meta.env.VITE_API_URL

export async function getPosts() {
  const response = await fetch(`${API_URL}/posts`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error al cargar publicaciones')
  }

  return data.posts
}

export async function createPost({ title, content }, token) {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo crear la publicación')
  }

  return data.post
}

export async function sendReaction(postId, { type, userId }) {
  const payload = userId ? { type, userId } : { type }
  const response = await fetch(`${API_URL}/posts/${postId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo registrar la reacción')
    error.status = response.status
    throw error
  }

  return data
}
