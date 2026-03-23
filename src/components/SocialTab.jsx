import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Copy, Heart, MessageCircle, Pencil, PlusSquare, Send, Sparkles, Trash2, Users } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import {
  socialDeletePost,
  searchPersonaggi,
  sendPrivateMessage,
  socialCreateComment,
  socialCreatePost,
  socialGetComments,
  socialGetKorpList,
  socialGetMyProfile,
  socialGetNotifications,
  socialGetProfileByCharacter,
  socialGetPosts,
  socialToggleLike,
  socialUpdatePost,
  socialUpdateMyProfile,
} from '../api';

const SocialTab = ({ onLogout }) => {
  const PAGE_SIZE = 10;
  const { selectedCharacterId, isAdmin } = useCharacter();
  const [posts, setPosts] = useState([]);
  const [korpList, setKorpList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsMetaByPost, setCommentsMetaByPost] = useState({});
  const [newCommentByPost, setNewCommentByPost] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [commentMentionSuggestions, setCommentMentionSuggestions] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [feedFilter, setFeedFilter] = useState('ALL');
  const [feedSort, setFeedSort] = useState('RECENT');
  const [feedPage, setFeedPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const sentinelRef = useRef(null);

  const [postForm, setPostForm] = useState({
    titolo: '',
    testo: '',
    visibilita: 'PUB',
    korp_visibilita: '',
    immagine: null,
    video: null,
  });
  const [dmText, setDmText] = useState('');

  const handlePostMediaChange = (file) => {
    if (!file) {
      setPostForm((p) => ({ ...p, immagine: null, video: null }));
      return;
    }
    if (String(file.type || '').startsWith('image/')) {
      setPostForm((p) => ({ ...p, immagine: file, video: null }));
      return;
    }
    if (String(file.type || '').startsWith('video/')) {
      setPostForm((p) => ({ ...p, video: file, immagine: null }));
      return;
    }
    alert('Formato non supportato. Usa una immagine o un video.');
  };

  const [profileForm, setProfileForm] = useState({
    regione: '',
    prefettura: '',
    descrizione: '',
    professioni: '',
    era_provenienza: '',
    foto_principale: null,
  });

  const normalizePostsPayload = useCallback((payload) => {
    if (Array.isArray(payload)) {
      return { items: payload, hasNext: false };
    }
    return {
      items: Array.isArray(payload?.results) ? payload.results : [],
      hasNext: Boolean(payload?.next),
    };
  }, []);

  const normalizeCommentsPayload = useCallback((payload) => {
    if (Array.isArray(payload)) {
      return { items: payload, hasNext: false };
    }
    return {
      items: Array.isArray(payload?.results) ? payload.results : [],
      hasNext: Boolean(payload?.next),
    };
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, korpData, profileData] = await Promise.all([
        socialGetPosts(selectedCharacterId, onLogout, 1, PAGE_SIZE),
        socialGetKorpList(onLogout),
        socialGetMyProfile(selectedCharacterId, onLogout),
      ]);
      const normalized = normalizePostsPayload(postsData);
      setPosts(normalized.items);
      setFeedPage(1);
      setHasMorePosts(normalized.hasNext);
      setKorpList(Array.isArray(korpData) ? korpData : []);
      setProfile(profileData || null);
      if (profileData) {
        setProfileForm({
          regione: profileData.regione || '',
          prefettura: profileData.prefettura || '',
          descrizione: profileData.descrizione || '',
          professioni: profileData.professioni || '',
          era_provenienza: profileData.era_provenienza || '',
          foto_principale: null,
        });
      }
    } catch (err) {
      console.error('SocialTab load error', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCharacterId, onLogout, normalizePostsPayload]);

  useEffect(() => {
    if (selectedCharacterId) loadAll();
  }, [selectedCharacterId, loadAll]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titolo', postForm.titolo);
    fd.append('testo', postForm.testo || '');
    fd.append('visibilita', postForm.visibilita);
    if (postForm.visibilita === 'KORP' && postForm.korp_visibilita) {
      fd.append('korp_visibilita', postForm.korp_visibilita);
    }
    if (postForm.immagine) fd.append('immagine', postForm.immagine);
    if (postForm.video) fd.append('video', postForm.video);

    await socialCreatePost(fd, selectedCharacterId, onLogout);
    setPostForm({
      titolo: '',
      testo: '',
      visibilita: 'PUB',
      korp_visibilita: '',
      immagine: null,
      video: null,
    });
    await loadAll();
  };

  const updatePostTextWithMentions = async (nextText) => {
    setPostForm((p) => ({ ...p, testo: nextText }));
    const match = nextText.match(/@([A-Za-z0-9_]{1,30})$/);
    if (!match) {
      setMentionSuggestions([]);
      return;
    }
    const q = match[1];
    if (!q) return;
    const res = await searchPersonaggi(q, selectedCharacterId);
    setMentionSuggestions(Array.isArray(res) ? res : []);
  };

  const loadMentionSuggestions = async (query) => {
    if (!query) return [];
    const res = await searchPersonaggi(query, selectedCharacterId);
    return Array.isArray(res) ? res : [];
  };

  const insertMention = (personaggio) => {
    setPostForm((p) => ({
      ...p,
      testo: `${p.testo.replace(/@([A-Za-z0-9_]{1,30})$/, '')}@${personaggio.id} `,
    }));
    setMentionSuggestions([]);
  };

  const updateCommentWithMentions = async (postId, nextText) => {
    setNewCommentByPost((prev) => ({ ...prev, [postId]: nextText }));
    const match = nextText.match(/@([A-Za-z0-9_]{1,30})$/);
    if (!match) {
      setCommentMentionSuggestions((prev) => ({ ...prev, [postId]: [] }));
      return;
    }
    const suggestions = await loadMentionSuggestions(match[1]);
    setCommentMentionSuggestions((prev) => ({ ...prev, [postId]: suggestions }));
  };

  const insertMentionInComment = (postId, personaggio) => {
    setNewCommentByPost((prev) => ({
      ...prev,
      [postId]: `${(prev[postId] || '').replace(/@([A-Za-z0-9_]{1,30})$/, '')}@${personaggio.id} `,
    }));
    setCommentMentionSuggestions((prev) => ({ ...prev, [postId]: [] }));
  };

  const handleToggleLike = async (postId) => {
    await socialToggleLike(postId, selectedCharacterId, onLogout);
    await loadAll();
  };

  const toggleComments = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    if (!commentsByPost[postId]) {
      const payload = await socialGetComments(postId, onLogout, 1, 10);
      const normalized = normalizeCommentsPayload(payload);
      setCommentsByPost((prev) => ({ ...prev, [postId]: normalized.items }));
      setCommentsMetaByPost((prev) => ({
        ...prev,
        [postId]: { page: 1, hasMore: normalized.hasNext, loadingMore: false },
      }));
    }
  };

  const ensureCommentsLoaded = async (postId) => {
    if (!commentsByPost[postId]) {
      const payload = await socialGetComments(postId, onLogout, 1, 10);
      const normalized = normalizeCommentsPayload(payload);
      setCommentsByPost((prev) => ({ ...prev, [postId]: normalized.items }));
      setCommentsMetaByPost((prev) => ({
        ...prev,
        [postId]: { page: 1, hasMore: normalized.hasNext, loadingMore: false },
      }));
    }
  };

  const loadMoreComments = async (postId) => {
    const meta = commentsMetaByPost[postId];
    if (!meta || meta.loadingMore || !meta.hasMore) return;
    const nextPage = (meta.page || 1) + 1;
    setCommentsMetaByPost((prev) => ({
      ...prev,
      [postId]: { ...meta, loadingMore: true },
    }));
    try {
      const payload = await socialGetComments(postId, onLogout, nextPage, 10);
      const normalized = normalizeCommentsPayload(payload);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), ...normalized.items],
      }));
      setCommentsMetaByPost((prev) => ({
        ...prev,
        [postId]: { page: nextPage, hasMore: normalized.hasNext, loadingMore: false },
      }));
    } catch (err) {
      console.error('Errore caricamento commenti aggiuntivi', err);
      setCommentsMetaByPost((prev) => ({
        ...prev,
        [postId]: { ...meta, loadingMore: false },
      }));
    }
  };

  const submitComment = async (postId) => {
    const text = (newCommentByPost[postId] || '').trim();
    if (!text) return;
    await socialCreateComment(postId, text, selectedCharacterId, onLogout);
    const payload = await socialGetComments(postId, onLogout, 1, 10);
    const normalized = normalizeCommentsPayload(payload);
    setCommentsByPost((prev) => ({ ...prev, [postId]: normalized.items }));
    setCommentsMetaByPost((prev) => ({
      ...prev,
      [postId]: { page: 1, hasMore: normalized.hasNext, loadingMore: false },
    }));
    setNewCommentByPost((prev) => ({ ...prev, [postId]: '' }));
    setCommentMentionSuggestions((prev) => ({ ...prev, [postId]: [] }));
    await loadAll();
  };

  const openProfile = async (personaggioId) => {
    const data = await socialGetProfileByCharacter(personaggioId, onLogout);
    setSelectedProfile(data);
    setDmText('');
  };

  const sendDmFromProfile = async () => {
    if (!selectedProfile?.personaggio || !dmText.trim()) return;
    await sendPrivateMessage(
      {
        destinatario_id: selectedProfile.personaggio,
        titolo: 'Messaggio da Fame-stagram',
        testo: dmText.trim(),
      },
      onLogout
    );
    setDmText('');
    alert('Messaggio inviato.');
  };

  const startEditPost = (post) => {
    setEditingPost({
      id: post.id,
      titolo: post.titolo || '',
      testo: post.testo || '',
      visibilita: post.visibilita || 'PUB',
      korp_visibilita: post.korp_visibilita || '',
      immagine: null,
      video: null,
    });
  };

  const saveEditedPost = async () => {
    if (!editingPost) return;
    const fd = new FormData();
    fd.append('titolo', editingPost.titolo || '');
    fd.append('testo', editingPost.testo || '');
    fd.append('visibilita', editingPost.visibilita || 'PUB');
    if (editingPost.visibilita === 'KORP' && editingPost.korp_visibilita) {
      fd.append('korp_visibilita', editingPost.korp_visibilita);
    } else {
      fd.append('korp_visibilita', '');
    }
    if (editingPost.immagine) {
      fd.append('immagine', editingPost.immagine);
      fd.append('video', '');
    }
    if (editingPost.video) {
      fd.append('video', editingPost.video);
      fd.append('immagine', '');
    }
    await socialUpdatePost(editingPost.id, fd, onLogout);
    setEditingPost(null);
    await loadAll();
  };

  const handleEditMediaChange = (file) => {
    if (!file) {
      setEditingPost((p) => ({ ...p, immagine: null, video: null }));
      return;
    }
    if (String(file.type || '').startsWith('image/')) {
      setEditingPost((p) => ({ ...p, immagine: file, video: null }));
      return;
    }
    if (String(file.type || '').startsWith('video/')) {
      setEditingPost((p) => ({ ...p, video: file, immagine: null }));
      return;
    }
    alert('Formato non supportato. Usa una immagine o un video.');
  };

  const removePost = async (postId) => {
    if (!window.confirm('Eliminare definitivamente questo post?')) return;
    await socialDeletePost(postId, onLogout);
    await loadAll();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('regione', profileForm.regione || '');
    fd.append('prefettura', profileForm.prefettura || '');
    fd.append('descrizione', profileForm.descrizione || '');
    fd.append('professioni', profileForm.professioni || '');
    fd.append('era_provenienza', profileForm.era_provenienza || '');
    if (profileForm.foto_principale) fd.append('foto_principale', profileForm.foto_principale);
    const updated = await socialUpdateMyProfile(fd, selectedCharacterId, onLogout);
    setProfile(updated);
    setProfileForm((prev) => ({ ...prev, foto_principale: null }));
  };

  const subtitle = useMemo(() => 'il social network numero 1 di tutta KOR!', []);
  const notificationsSeenKey = useMemo(
    () => `social_notifications_seen_at:${selectedCharacterId || 'none'}`,
    [selectedCharacterId]
  );

  const loadNotifications = useCallback(async () => {
    if (!selectedCharacterId) return;
    try {
      const since = localStorage.getItem(notificationsSeenKey) || null;
      const payload = await socialGetNotifications(selectedCharacterId, onLogout, { limit: 30, since });
      setNotifications(Array.isArray(payload?.results) ? payload.results : []);
      setNotificationsUnread(Number(payload?.unread_count || 0));
    } catch (err) {
      console.error('Errore caricamento notifiche social', err);
    }
  }, [selectedCharacterId, onLogout, notificationsSeenKey]);

  useEffect(() => {
    loadNotifications();
    const id = window.setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => window.clearInterval(id);
  }, [loadNotifications]);

  const openActivityModal = async () => {
    const seenAt = new Date().toISOString();
    localStorage.setItem(notificationsSeenKey, seenAt);
    setNotificationsUnread(0);
    await loadNotifications();
    setShowActivityModal(true);
  };

  const renderTextWithMentions = (text, tags) => {
    if (!text) return null;
    const mapById = new Map((tags || []).map((t) => [String(t.personaggio_id), t.personaggio__nome || `#${t.personaggio_id}`]));
    const parts = [];
    const regex = /@([A-Za-z0-9_]+)/g;
    let last = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index;
      const end = regex.lastIndex;
      const token = m[1];
      if (start > last) parts.push({ type: 'text', value: text.slice(last, start) });
      if (/^\d+$/.test(token) && mapById.has(token)) {
        parts.push({ type: 'mention', id: Number(token), label: mapById.get(token), raw: m[0] });
      } else {
        parts.push({ type: 'text', value: m[0] });
      }
      last = end;
    }
    if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((p, idx) =>
          p.type === 'mention' ? (
            <button
              key={`m-${idx}-${p.id}`}
              type="button"
              onClick={() => openProfile(p.id)}
              className="underline decoration-dotted text-amber-300 hover:text-amber-100"
            >
              @{p.label}
            </button>
          ) : (
            <React.Fragment key={`t-${idx}`}>{p.value}</React.Fragment>
          )
        )}
      </span>
    );
  };

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (feedFilter === 'PUB') list = posts.filter((p) => p.visibilita === 'PUB');
    if (feedFilter === 'KORP') list = posts.filter((p) => p.visibilita === 'KORP');
    if (feedFilter === 'MINE') list = posts.filter((p) => Number(p.autore) === Number(selectedCharacterId));

    const sorted = [...list];
    if (feedSort === 'DISCUSSED') {
      sorted.sort((a, b) => {
        const bScore = Number(b.comments_count || 0) * 3 + Number(b.likes_count || 0);
        const aScore = Number(a.comments_count || 0) * 3 + Number(a.likes_count || 0);
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return sorted;
    }
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [posts, feedFilter, selectedCharacterId, feedSort]);

  const loadNextPosts = useCallback(async () => {
    if (loading || loadingMorePosts || !hasMorePosts) return;
    const nextPage = feedPage + 1;
    setLoadingMorePosts(true);
    try {
      const payload = await socialGetPosts(selectedCharacterId, onLogout, nextPage, PAGE_SIZE);
      const normalized = normalizePostsPayload(payload);
      setPosts((prev) => [...prev, ...normalized.items]);
      setFeedPage(nextPage);
      setHasMorePosts(normalized.hasNext);
    } catch (err) {
      console.error('Errore caricamento pagina successiva feed', err);
    } finally {
      setLoadingMorePosts(false);
    }
  }, [loading, loadingMorePosts, hasMorePosts, feedPage, selectedCharacterId, onLogout, normalizePostsPayload]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        loadNextPosts();
      },
      { root: null, rootMargin: '300px 0px', threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextPosts]);

  if (!selectedCharacterId) {
    return <div className="p-6 text-gray-300">Seleziona un personaggio per usare Fame-stagram.</div>;
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 bg-linear-to-b from-gray-900 to-[#20131f] min-h-full">
      <section className="sticky top-2 z-20 rounded-2xl border border-amber-400/30 bg-black/60 backdrop-blur p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMyProfileModal(true)}
              className="h-12 w-12 rounded-full border border-amber-300/40 overflow-hidden bg-gray-800 hover:border-amber-200 transition"
              title="Apri il mio profilo social"
            >
              {profile?.foto_principale ? (
                <img src={profile.foto_principale} alt="Profilo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-amber-200 font-bold">
                  {(profile?.personaggio_nome || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <div>
              <h2 className="text-3xl font-black italic text-amber-300 tracking-wide">Fame-stagram</h2>
              <p className="text-sm text-amber-100/80">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowComposer((s) => !s)}
              className="inline-flex items-center gap-2 bg-indigo-700/90 hover:bg-indigo-600 rounded-lg px-3 py-2 text-sm font-bold"
            >
              <PlusSquare size={16} />
              {showComposer ? 'Chiudi nuovo post' : 'Nuovo post'}
            </button>
            <button
              type="button"
              onClick={openActivityModal}
              className="relative inline-flex items-center gap-2 bg-gray-800/90 hover:bg-gray-700 rounded-lg px-3 py-2 text-sm font-bold border border-gray-600"
              title="Attivita social"
            >
              <Bell size={16} />
              Attivita
              {notificationsUnread > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-5 text-center">
                  {notificationsUnread > 99 ? '99+' : notificationsUnread}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {showComposer && (
      <section className="grid grid-cols-1 gap-6">
        <form onSubmit={handleCreatePost} className="rounded-2xl border border-indigo-500/30 bg-gray-900/70 p-4 space-y-3 max-w-4xl">
          <div className="flex items-center gap-2 text-indigo-300 font-bold"><PlusSquare size={18} /> Nuovo Post</div>
          <input
            className="w-full bg-gray-800 rounded p-2 border border-gray-700"
            placeholder="Titolo"
            value={postForm.titolo}
            onChange={(e) => setPostForm((p) => ({ ...p, titolo: e.target.value }))}
            required
          />
          <textarea
            className="w-full bg-gray-800 rounded p-2 border border-gray-700 min-h-24"
            placeholder="Testo del post..."
            value={postForm.testo}
            onChange={(e) => updatePostTextWithMentions(e.target.value)}
          />
          {mentionSuggestions.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm">
              <div className="text-xs text-gray-400 mb-1">Suggerimenti tag (@):</div>
              <div className="flex flex-wrap gap-2">
                {mentionSuggestions.map((p) => (
                  <button key={p.id} type="button" onClick={() => insertMention(p)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">
                    {p.nome} <span className="text-xs text-gray-400">@{p.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
              className="bg-gray-800 rounded p-2 border border-gray-700"
              value={postForm.visibilita}
              onChange={(e) => setPostForm((p) => ({ ...p, visibilita: e.target.value }))}
            >
              <option value="PUB">Pubblico</option>
              <option value="KORP">Solo KORP</option>
            </select>
            {postForm.visibilita === 'KORP' && (
              <select
                className="bg-gray-800 rounded p-2 border border-gray-700"
                value={postForm.korp_visibilita}
                onChange={(e) => setPostForm((p) => ({ ...p, korp_visibilita: e.target.value }))}
                required
              >
                <option value="">Seleziona KORP</option>
                {korpList.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}
              </select>
            )}
          </div>
          <div className="text-sm space-y-1">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handlePostMediaChange(e.target.files?.[0] || null)}
            />
            <div className="text-xs text-gray-400">
              Carica una foto o un video (uno solo per post).
            </div>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded p-2 font-bold">Pubblica</button>
        </form>
      </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-pink-300 font-bold"><Sparkles size={18} /> Feed Sociale</div>
          <div className="flex flex-wrap gap-2 text-xs items-center">
            {[
              { id: 'ALL', label: 'Tutti' },
              { id: 'PUB', label: 'Pubblici' },
              { id: 'KORP', label: 'Solo KORP' },
              { id: 'MINE', label: 'I miei' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeedFilter(f.id)}
                className={`px-2 py-1 rounded border ${feedFilter === f.id ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <button
              type="button"
              onClick={() => setFeedSort('RECENT')}
              className={`px-2 py-1 rounded border ${feedSort === 'RECENT' ? 'bg-fuchsia-700 border-fuchsia-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
            >
              Piu recenti
            </button>
            <button
              type="button"
              onClick={() => setFeedSort('DISCUSSED')}
              className={`px-2 py-1 rounded border ${feedSort === 'DISCUSSED' ? 'bg-fuchsia-700 border-fuchsia-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
            >
              Piu discussi
            </button>
          </div>
        </div>
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={`sk-${idx}`} className="rounded-2xl border border-gray-700 bg-gray-900/80 p-4 animate-pulse space-y-3">
                <div className="h-5 bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-64 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && filteredPosts.length === 0 && <div className="text-gray-400">Nessun post per questo filtro.</div>}
        {filteredPosts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-gray-700 bg-gray-900/80 p-4 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="font-bold text-lg">{post.titolo}</h3>
                <p className="text-xs text-gray-400">
                  <button type="button" onClick={() => openProfile(post.autore)} className="underline decoration-dotted hover:text-white">
                    {post.autore_nome}
                  </button>{' '}
                  · {new Date(post.created_at).toLocaleString('it-IT')}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-600">
                {post.visibilita === 'KORP' ? 'Solo KORP' : 'Pubblico'}
              </span>
            </div>
            {post.evento_titolo && (
              <div className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-amber-400/40 bg-amber-900/20 text-amber-200">
                Evento: {post.evento_titolo}
              </div>
            )}
            {post.testo && <p className="text-gray-200">{renderTextWithMentions(post.testo, post.tags)}</p>}
            {post.tags?.length > 0 && (
              <div className="text-xs text-amber-300/90">
                Tag:{' '}
                {post.tags.map((t) => (
                  <button
                    key={`pt-${post.id}-${t.personaggio_id}`}
                    type="button"
                    onClick={() => openProfile(t.personaggio_id)}
                    className="mr-2 underline decoration-dotted hover:text-amber-100"
                  >
                    @{t.personaggio__nome || t.personaggio_id}
                  </button>
                ))}
              </div>
            )}
            {post.immagine && (
              <div className="w-full max-w-md mx-auto aspect-4/5 rounded-lg overflow-hidden border border-gray-700 bg-black/40">
                <img src={post.immagine} alt={post.titolo} className="h-full w-full object-cover" />
              </div>
            )}
            {post.video && (
              <div className="w-full max-w-md mx-auto aspect-4/5 rounded-lg overflow-hidden border border-gray-700 bg-black">
                <video controls src={post.video} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => handleToggleLike(post.id)} className="inline-flex items-center gap-1 text-sm text-rose-300 hover:text-rose-200">
                <Heart size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} /> {post.likes_count || 0}
              </button>
              <button onClick={() => toggleComments(post.id)} className="inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200">
                <MessageCircle size={16} /> {post.comments_count || 0}
              </button>
              {post.public_url && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(post.public_url);
                    alert('Link pubblico copiato.');
                  }}
                  className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
                  title={post.public_url}
                >
                  <Copy size={16} /> Link
                </button>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => startEditPost(post)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200"
                  >
                    <Pencil size={16} /> Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => removePost(post.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-300 hover:text-red-200"
                  >
                    <Trash2 size={16} /> Elimina
                  </button>
                </>
              )}
            </div>
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 rounded p-2 border border-gray-700 text-sm"
                  placeholder="Scrivi un commento..."
                  value={newCommentByPost[post.id] || ''}
                  onFocus={() => ensureCommentsLoaded(post.id)}
                  onChange={(e) => updateCommentWithMentions(post.id, e.target.value)}
                />
                <button onClick={() => submitComment(post.id)} className="bg-indigo-600 hover:bg-indigo-500 rounded px-3 text-sm">Invia</button>
              </div>
              {(commentMentionSuggestions[post.id] || []).length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm">
                  <div className="text-xs text-gray-400 mb-1">Suggerimenti tag commento:</div>
                  <div className="flex flex-wrap gap-2">
                    {(commentMentionSuggestions[post.id] || []).map((p) => (
                      <button
                        key={`cm-${post.id}-${p.id}`}
                        type="button"
                        onClick={() => insertMentionInComment(post.id, p)}
                        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                      >
                        {p.nome} <span className="text-xs text-gray-400">@{p.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className="text-xs text-sky-300 hover:text-sky-200 underline decoration-dotted"
              >
                {expandedPostId === post.id ? 'Nascondi commenti' : 'Mostra commenti'}
              </button>
              {(() => {
                const loadedComments = commentsByPost[post.id] || [];
                const commentsToRender =
                  expandedPostId === post.id ? loadedComments : loadedComments.slice(-2);
                return (
              <div className="space-y-2">
                {commentsToRender.map((c) => (
                  <div key={c.id} className="text-sm bg-gray-800/70 rounded p-2">
                    <span className="font-semibold text-gray-200">{c.autore_nome}:</span>{' '}
                    <span className="text-gray-300">{renderTextWithMentions(c.testo, c.tags)}</span>
                    {c.tags?.length > 0 && (
                      <span className="text-xs text-amber-300/90 ml-2">
                        {c.tags.map((t) => (
                          <button
                            key={`ct-${c.id}-${t.personaggio_id}`}
                            type="button"
                            onClick={() => openProfile(t.personaggio_id)}
                            className="mr-2 underline decoration-dotted hover:text-amber-100"
                          >
                            @{t.personaggio__nome || t.personaggio_id}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
                {expandedPostId === post.id && commentsMetaByPost[post.id]?.hasMore && (
                  <button
                    type="button"
                    onClick={() => loadMoreComments(post.id)}
                    disabled={commentsMetaByPost[post.id]?.loadingMore}
                    className="text-xs text-indigo-300 hover:text-indigo-200 underline decoration-dotted disabled:opacity-60"
                  >
                    {commentsMetaByPost[post.id]?.loadingMore ? 'Caricamento...' : 'Carica altri commenti'}
                  </button>
                )}
              </div>
                );
              })()}
            </div>
          </article>
        ))}
        {!loading && hasMorePosts && (
          <div ref={sentinelRef} className="py-5 text-center text-gray-400 text-sm">
            {loadingMorePosts ? 'Caricamento post precedenti...' : 'Scorri per caricare altri post'}
          </div>
        )}
      </section>
      </div>
      {showMyProfileModal && (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-gray-900 border border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Il mio profilo social</h3>
            <button onClick={() => setShowMyProfileModal(false)} className="text-gray-400 hover:text-white">X</button>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="text-xs text-gray-400">
              <div>Nome: <span className="text-gray-200">{profile?.personaggio_nome || '-'}</span></div>
              <div>KORP: <span className="text-gray-200">{profile?.korp_nome || '-'}</span></div>
              <div>Segno zodiacale: <span className="text-gray-200">{profile?.segno_zodiacale || '-'}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="bg-gray-800 rounded p-2 border border-gray-700" placeholder="Regione" value={profileForm.regione} onChange={(e) => setProfileForm((p) => ({ ...p, regione: e.target.value }))} />
              <input className="bg-gray-800 rounded p-2 border border-gray-700" placeholder="Prefettura" value={profileForm.prefettura} onChange={(e) => setProfileForm((p) => ({ ...p, prefettura: e.target.value }))} />
            </div>
            <input className="w-full bg-gray-800 rounded p-2 border border-gray-700" placeholder="Professioni" value={profileForm.professioni} onChange={(e) => setProfileForm((p) => ({ ...p, professioni: e.target.value }))} />
            <input className="w-full bg-gray-800 rounded p-2 border border-gray-700" placeholder="Era di provenienza" value={profileForm.era_provenienza} onChange={(e) => setProfileForm((p) => ({ ...p, era_provenienza: e.target.value }))} />
            <textarea className="w-full bg-gray-800 rounded p-2 border border-gray-700 min-h-20" placeholder="Descrizione" value={profileForm.descrizione} onChange={(e) => setProfileForm((p) => ({ ...p, descrizione: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => setProfileForm((p) => ({ ...p, foto_principale: e.target.files?.[0] || null }))} />
            <button className="w-full bg-amber-700 hover:bg-amber-600 rounded p-2 font-bold">Salva Profilo</button>
          </form>
        </div>
      </div>
      )}
      {selectedProfile && (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-gray-900 border border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Profilo social: {selectedProfile.personaggio_nome}</h3>
            <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-white">X</button>
          </div>
          <div className="text-sm text-gray-300 space-y-1">
            <div>KORP: <span className="text-white">{selectedProfile.korp_nome || '-'}</span></div>
            <div>Segno: <span className="text-white">{selectedProfile.segno_zodiacale || '-'}</span></div>
            <div>Regione: <span className="text-white">{selectedProfile.regione || '-'}</span></div>
            <div>Prefettura: <span className="text-white">{selectedProfile.prefettura || '-'}</span></div>
            <div>Professioni: <span className="text-white">{selectedProfile.professioni || '-'}</span></div>
            <div>Era: <span className="text-white">{selectedProfile.era_provenienza || '-'}</span></div>
            <div>Descrizione: <span className="text-white">{selectedProfile.descrizione || '-'}</span></div>
          </div>
          {selectedProfile.personaggio !== Number(selectedCharacterId) && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <textarea
                className="w-full bg-gray-800 rounded p-2 border border-gray-700 min-h-20"
                placeholder="Scrivi un messaggio privato..."
                value={dmText}
                onChange={(e) => setDmText(e.target.value)}
              />
              <button onClick={sendDmFromProfile} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded px-3 py-2 text-sm">
                <Send size={14} /> Invia messaggio privato
              </button>
            </div>
          )}
        </div>
      </div>
      )}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Modifica post (admin)</h3>
              <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-white">X</button>
            </div>
            <input
              className="w-full bg-gray-800 rounded p-2 border border-gray-700"
              value={editingPost.titolo}
              onChange={(e) => setEditingPost((p) => ({ ...p, titolo: e.target.value }))}
            />
            <textarea
              className="w-full bg-gray-800 rounded p-2 border border-gray-700 min-h-24"
              value={editingPost.testo}
              onChange={(e) => setEditingPost((p) => ({ ...p, testo: e.target.value }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                className="bg-gray-800 rounded p-2 border border-gray-700"
                value={editingPost.visibilita}
                onChange={(e) => setEditingPost((p) => ({ ...p, visibilita: e.target.value }))}
              >
                <option value="PUB">Pubblico</option>
                <option value="KORP">Solo KORP</option>
              </select>
              {editingPost.visibilita === 'KORP' && (
                <select
                  className="bg-gray-800 rounded p-2 border border-gray-700"
                  value={editingPost.korp_visibilita}
                  onChange={(e) => setEditingPost((p) => ({ ...p, korp_visibilita: e.target.value }))}
                >
                  <option value="">Seleziona KORP</option>
                  {korpList.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}
                </select>
              )}
            </div>
            <div className="text-sm space-y-1">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleEditMediaChange(e.target.files?.[0] || null)}
              />
              <div className="text-xs text-gray-400">
                Carica una foto o un video (uno solo per post).
              </div>
            </div>
            <button onClick={saveEditedPost} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded p-2 font-bold">
              Salva modifiche
            </button>
          </div>
        </div>
      )}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-700 p-4 space-y-3 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Attivita social</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-white">X</button>
            </div>
            <div className="overflow-auto space-y-2 pr-1">
              {notifications.length === 0 && (
                <div className="text-sm text-gray-400">Nessuna notifica recente.</div>
              )}
              {notifications.map((n, idx) => (
                <button
                  key={`n-${n.kind}-${n.post_id}-${n.created_at}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (n.post_id) setExpandedPostId(n.post_id);
                    setShowActivityModal(false);
                  }}
                  className="w-full text-left rounded-lg border border-gray-700 bg-gray-800/70 hover:bg-gray-800 p-3"
                >
                  <div className="text-xs text-gray-400 mb-1">{new Date(n.created_at).toLocaleString('it-IT')}</div>
                  <div className="text-sm text-gray-100">
                    {n.kind === 'like' && <span><b>{n.actor_name}</b> ha messo like al tuo post.</span>}
                    {n.kind === 'comment' && <span><b>{n.actor_name}</b> ha commentato il tuo post.</span>}
                    {n.kind === 'mention_post' && <span><b>{n.actor_name}</b> ti ha menzionato in un post.</span>}
                    {n.kind === 'mention_comment' && <span><b>{n.actor_name}</b> ti ha menzionato in un commento.</span>}
                  </div>
                  {n.post_title && <div className="text-xs text-amber-200/80 mt-1">Post: {n.post_title}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialTab;
