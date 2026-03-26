import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { resolveMediaUrl, socialMarkStoryViewed, socialReactStory, socialReplyStory } from '../api';

const DEFAULT_DURATION_MS = 6500;

const StoryViewerModal = ({ open, onClose, stories = [], initialIndex = 0, personaggioId, onLogout, onStoryUpdated }) => {
  const [idx, setIdx] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setIdx(initialIndex || 0);
    setProgress(0);
    setReplyText('');
  }, [open, initialIndex]);

  const story = stories[idx] || null;
  const mediaUrl = useMemo(() => resolveMediaUrl(story?.media), [story?.media]);
  const isVideo = useMemo(() => {
    const u = String(story?.media || '').toLowerCase();
    return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.includes('video');
  }, [story?.media]);

  const goNext = () => {
    if (idx < stories.length - 1) {
      setIdx((i) => i + 1);
      setProgress(0);
      setReplyText('');
      return;
    }
    onClose?.();
  };

  const goPrev = () => {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setProgress(0);
      setReplyText('');
      return;
    }
    onClose?.();
  };

  // Mark viewed on story change
  useEffect(() => {
    if (!open || !story?.id) return;
    if (story.viewed_by_me) return;
    socialMarkStoryViewed(story.id, personaggioId, onLogout)
      .then(() => onStoryUpdated?.({ storyId: story.id, patch: { viewed_by_me: true } }))
      .catch(() => {});
  }, [open, story?.id]);

  // Progress timer
  useEffect(() => {
    if (!open || !story) return;
    const duration = DEFAULT_DURATION_MS;
    startRef.current = performance.now();
    const tick = (t) => {
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        rafRef.current = null;
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [open, idx, story?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2">
      <div className="w-full max-w-md h-[92vh] rounded-2xl overflow-hidden border border-amber-300/25 bg-[#07040a] shadow-2xl flex flex-col">
        <div className="p-3 border-b border-amber-300/15 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-100 truncate">{story?.autore_nome || 'Story'}</div>
              <div className="h-1 mt-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-linear-to-r from-fuchsia-400 via-amber-300 to-rose-400" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              title="Chiudi"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <button
            type="button"
            onClick={goPrev}
            className="absolute inset-y-0 left-0 w-1/3 z-10"
            title="Precedente"
          />
          <button
            type="button"
            onClick={goNext}
            className="absolute inset-y-0 right-0 w-1/3 z-10"
            title="Successiva"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-contain"
                  playsInline
                  autoPlay
                  muted
                />
              ) : (
                <img src={mediaUrl} alt="story" className="w-full h-full object-contain" />
              )
            ) : (
              <div className="p-8 text-center text-white/70">Story senza media</div>
            )}
          </div>

          {story?.testo && (
            <div className="absolute bottom-16 left-0 right-0 p-4">
              <div className="rounded-xl bg-black/55 border border-white/10 p-3 text-white text-sm whitespace-pre-wrap">
                {story.testo}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-amber-300/15 bg-black/40">
          <div className="flex items-center gap-2 mb-2">
            {['❤️', '🔥', '✨', '😂', '😮'].map((e) => (
              <button
                key={`react-${e}`}
                type="button"
                onClick={async () => {
                  if (!story?.id) return;
                  try {
                    await socialReactStory(story.id, e, personaggioId, onLogout);
                    onStoryUpdated?.({ storyId: story.id, patch: { my_reaction: e, reacted_by_me: true } });
                  } catch {}
                }}
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm"
                title={`Reagisci ${e}`}
              >
                {e}
              </button>
            ))}
            <div className="flex-1" />
            <div className="text-xs text-white/60 inline-flex items-center gap-1">
              <Heart size={14} /> {Number(story?.reactions_count || 0)}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={1}
              placeholder="Rispondi (invia DM all'autore)..."
              className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
            />
            <button
              type="button"
              onClick={async () => {
                const t = (replyText || '').trim();
                if (!t || !story?.id) return;
                try {
                  await socialReplyStory(story.id, t, true, personaggioId, onLogout);
                  setReplyText('');
                } catch {}
              }}
              className="px-3 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold inline-flex items-center gap-2"
              title="Invia risposta"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewerModal;

