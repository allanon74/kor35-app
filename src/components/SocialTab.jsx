import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Heart, MessageCircle, PlusSquare, Send, Sparkles, Users } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import {
  searchPersonaggi,
  sendPrivateMessage,
  socialCreateComment,
  socialCreatePost,
  socialGetComments,
  socialGetKorpList,
  socialGetMyProfile,
  socialGetProfileByCharacter,
  socialGetPosts,
  socialToggleLike,
  socialUpdateMyProfile,
} from '../api';

const SocialTab = ({ onLogout }) => {
  const { selectedCharacterId } = useCharacter();
  const [posts, setPosts] = useState([]);
  const [korpList, setKorpList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [newCommentByPost, setNewCommentByPost] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  const [postForm, setPostForm] = useState({
    titolo: '',
    testo: '',
    visibilita: 'PUB',
    korp_visibilita: '',
    immagine: null,
    video: null,
  });
  const [dmText, setDmText] = useState('');

  const [profileForm, setProfileForm] = useState({
    regione: '',
    prefettura: '',
    descrizione: '',
    professioni: '',
    era_provenienza: '',
    foto_principale: null,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, korpData, profileData] = await Promise.all([
        socialGetPosts(selectedCharacterId, onLogout),
        socialGetKorpList(onLogout),
        socialGetMyProfile(selectedCharacterId, onLogout),
      ]);
      setPosts(Array.isArray(postsData) ? postsData : []);
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
  }, [selectedCharacterId, onLogout]);

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

  const insertMention = (personaggio) => {
    setPostForm((p) => ({
      ...p,
      testo: `${p.testo.replace(/@([A-Za-z0-9_]{1,30})$/, '')}@${personaggio.id} `,
    }));
    setMentionSuggestions([]);
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
      const comments = await socialGetComments(postId, onLogout);
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments || [] }));
    }
  };

  const submitComment = async (postId) => {
    const text = (newCommentByPost[postId] || '').trim();
    if (!text) return;
    await socialCreateComment(postId, text, selectedCharacterId, onLogout);
    const comments = await socialGetComments(postId, onLogout);
    setCommentsByPost((prev) => ({ ...prev, [postId]: comments || [] }));
    setNewCommentByPost((prev) => ({ ...prev, [postId]: '' }));
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

  if (!selectedCharacterId) {
    return <div className="p-6 text-gray-300">Seleziona un personaggio per usare Fame-stagram.</div>;
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 bg-linear-to-b from-gray-900 to-[#20131f] min-h-full">
      <section className="rounded-2xl border border-amber-400/30 bg-black/20 p-4 shadow-xl">
        <h2 className="text-3xl font-black italic text-amber-300 tracking-wide">Fame-stagram</h2>
        <p className="text-sm text-amber-100/80">{subtitle}</p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={handleCreatePost} className="rounded-2xl border border-indigo-500/30 bg-gray-900/70 p-4 space-y-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <input type="file" accept="image/*" onChange={(e) => setPostForm((p) => ({ ...p, immagine: e.target.files?.[0] || null, video: null }))} />
            <input type="file" accept="video/*" onChange={(e) => setPostForm((p) => ({ ...p, video: e.target.files?.[0] || null, immagine: null }))} />
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded p-2 font-bold">Pubblica</button>
        </form>

        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-amber-500/30 bg-gray-900/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold"><Users size={18} /> Profilo Social</div>
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
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-pink-300 font-bold"><Sparkles size={18} /> Feed Sociale</div>
        {loading && <div className="text-gray-400">Caricamento feed...</div>}
        {!loading && posts.length === 0 && <div className="text-gray-400">Ancora nessun post.</div>}
        {posts.map((post) => (
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
            {post.testo && <p className="text-gray-200 whitespace-pre-wrap">{post.testo}</p>}
            {post.tags?.length > 0 && (
              <div className="text-xs text-amber-300/90">
                Tag: {post.tags.map((t) => `@${t.personaggio_id}`).join(' ')}
              </div>
            )}
            {post.immagine && <img src={post.immagine} alt={post.titolo} className="max-h-96 rounded-lg w-full object-cover border border-gray-700" />}
            {post.video && <video controls src={post.video} className="max-h-96 rounded-lg w-full border border-gray-700" />}
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
            </div>
            {expandedPostId === post.id && (
              <div className="pt-2 border-t border-gray-700 space-y-2">
                {(commentsByPost[post.id] || []).map((c) => (
                  <div key={c.id} className="text-sm bg-gray-800/70 rounded p-2">
                    <span className="font-semibold text-gray-200">{c.autore_nome}:</span> <span className="text-gray-300">{c.testo}</span>
                    {c.tags?.length > 0 && (
                      <span className="text-xs text-amber-300/90 ml-2">
                        {c.tags.map((t) => `@${t.personaggio_id}`).join(' ')}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-800 rounded p-2 border border-gray-700 text-sm"
                    placeholder="Scrivi un commento..."
                    value={newCommentByPost[post.id] || ''}
                    onChange={(e) => setNewCommentByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button onClick={() => submitComment(post.id)} className="bg-indigo-600 hover:bg-indigo-500 rounded px-3 text-sm">Invia</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
      </div>
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
    </>
  );
};

export default SocialTab;
