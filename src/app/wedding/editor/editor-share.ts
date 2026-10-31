import { EditorState, restoreEditorState } from './editor-state';

/**
 * Chia sẻ bằng link: a design packed into the URL hash (#d=…) — compressed
 * where the browser can (CompressionStream), base64url either way — so it
 * travels without a server. Uploaded photos stay behind: they are too big
 * for a link, so photo stickers arrive empty.
 */

export const SHARE_HASH = '#d=';

interface Shared {
  name: string;
  state: Omit<EditorState, 'tab' | 'envelopeFace' | 'overview'>;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>));
  return new Uint8Array(await out.arrayBuffer());
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof Response === 'function';

/** The part of a state worth sharing: the design and the facts, without this browser's photos or view. */
function shareable(state: EditorState): Shared['state'] {
  const { v, mode, from, palette, fonts, card, envelope, directions, content, stickers } = state;
  return {
    v,
    mode,
    from,
    palette,
    fonts,
    card,
    envelope,
    directions: { ...directions, mapPhoto: '', map: directions.map === 'image' ? 'sketch' : directions.map },
    content,
    stickers: stickers.map((sticker) => {
      const copy = { ...sticker };
      delete copy.photo;
      return copy;
    }),
  };
}

/** "z…" (deflated) or "j…" (plain JSON), base64url. */
export async function encodeShare(state: EditorState, name: string): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ name, state: shareable(state) } satisfies Shared));
  if (canCompress()) {
    try {
      return `z${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`;
    } catch {
      // Fall through to plain JSON.
    }
  }
  return `j${toBase64Url(json)}`;
}

/** A shared design, checked like a saved one; null when the link is damaged. */
export async function decodeShare(payload: string): Promise<{ name: string; state: EditorState } | null> {
  try {
    const kind = payload[0];
    let bytes = fromBase64Url(payload.slice(1));
    if (kind === 'z') {
      if (!canCompress()) {
        return null;
      }
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    } else if (kind !== 'j') {
      return null;
    }
    const shared = JSON.parse(new TextDecoder().decode(bytes)) as Partial<Shared>;
    if (!shared?.state || typeof shared.state !== 'object') {
      return null;
    }
    const state = restoreEditorState(JSON.stringify({ ...shared.state, v: 1 }));
    return { name: typeof shared.name === 'string' && shared.name ? shared.name.slice(0, 60) : 'Phương án được chia sẻ', state };
  } catch {
    return null;
  }
}
