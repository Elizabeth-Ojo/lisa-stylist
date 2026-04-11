'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Constants ───
const CATEGORIES = [
  { id: 'tops', label: 'Tops & Knits', icon: '👚' },
  { id: 'bottoms', label: 'Bottoms', icon: '👖' },
  { id: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { id: 'dresses', label: 'Dresses', icon: '👗' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'bags', label: 'Bags', icon: '👜' },
  { id: 'jewellery', label: 'Jewellery', icon: '💍' },
  { id: 'wigs', label: 'Wigs & Hair', icon: '💇‍♀️' },
  { id: 'activewear', label: 'Activewear', icon: '🏋️‍♀️' },
];

const OCCASIONS = [
  { id: 'wfh', label: 'WFH', icon: '🏠', desc: 'Camera-ready comfort' },
  { id: 'church', label: 'Church', icon: '⛪', desc: 'Modest & elegant' },
  { id: 'retreat', label: 'Retreat', icon: '💼', desc: 'Smart casual, travel-ready' },
  { id: 'date', label: 'Date Night', icon: '🕯️', desc: 'Intentional & feminine' },
  { id: 'brunch', label: 'Brunch', icon: '🥂', desc: 'Relaxed but styled' },
  { id: 'party', label: 'Party', icon: '🎂', desc: 'Fun & celebratory' },
  { id: 'travel', label: 'Travel', icon: '✈️', desc: 'Practical & photo-ready' },
  { id: 'casual', label: 'Casual', icon: '☕', desc: 'Visiting friends' },
  { id: 'gym', label: 'Gym', icon: '🏋️‍♀️', desc: 'Activewear styling' },
];

const STORAGE_KEY = 'style-v4-wardrobe';

// ─── Image compression ───
function compressImage(file, maxWidth = 400, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Main App ───
export default function Home() {
  const [screen, setScreen] = useState('home');
  const [wardrobe, setWardrobe] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [styleItem, setStyleItem] = useState(null);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [itemFile, setItemFile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const styleFileRef = useRef(null);
  const styleCameraRef = useRef(null);

  // Load wardrobe from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWardrobe(JSON.parse(saved));
    } catch {}
    setInitialized(true);
  }, []);

  // Save wardrobe on change
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
      } catch (e) {
        console.error('Storage full:', e);
      }
    }
  }, [wardrobe, initialized]);

  // Fetch Dublin weather
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,weathercode&timezone=Europe/Dublin')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weathercode }))
      .catch(() => {});
  }, []);

  const weatherDesc = (code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    return 'Mixed';
  };

  const totalPieces = Object.values(wardrobe).reduce((s, items) => s + (items?.length || 0), 0);
  const filledCategories = Object.keys(wardrobe).filter(k => wardrobe[k]?.length > 0).length;

  // ─── Add item ───
  const handleAddItem = async () => {
    if (!itemName.trim() || !itemFile || !selectedCategory) return;
    const compressed = await compressImage(itemFile);
    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      image: compressed,
      addedAt: new Date().toISOString(),
    };
    setWardrobe(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), newItem],
    }));
    setItemName('');
    setItemImage(null);
    setItemFile(null);
    setAddingItem(false);
  };

  // ─── Delete item ───
  const handleDeleteItem = (catId, itemId) => {
    if (!confirm('Remove this piece?')) return;
    setWardrobe(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).filter(i => i.id !== itemId),
    }));
  };

  // ─── Handle file selection ───
  const handleFileSelect = (e, callback) => {
    const f = e.target.files?.[0];
    if (f) callback(f);
    e.target.value = '';
  };

  // ─── Style request ───
  const handleStyleRequest = async () => {
    if (!styleItem || !selectedOccasion) return;
    setLoading(true);
    setLoadingMsg('Analysing your item...');
    setScreen('result');

    const wardrobeSummary = Object.entries(wardrobe)
      .map(([cat, items]) => {
        if (!items?.length) return null;
        const catLabel = CATEGORIES.find(c => c.id === cat)?.label || cat;
        return `${catLabel}: ${items.map(i => i.name).join(', ')}`;
      })
      .filter(Boolean)
      .join('\n');

    const occasionLabel = OCCASIONS.find(o => o.id === selectedOccasion)?.label || selectedOccasion;
    const weatherInfo = weather ? `${weather.temp}°C, ${weatherDesc(weather.code)} in Dublin` : 'Dublin weather (typically 8-16°C, often rainy)';

    try {
      setLoadingMsg('Styling 3 looks for you...');
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: styleItem.name,
          itemCategory: styleItem.category,
          imageBase64: styleItem.image?.startsWith('data:') ? styleItem.image.split(',')[1] : null,
          occasion: occasionLabel,
          weather: weatherInfo,
          wardrobe: wardrobeSummary,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
    } catch (err) {
      console.error('Style error:', err);
      setAiResult({
        looks: [{
          name: 'Connection Error',
          pieces: ['Could not reach the styling AI — try again in a moment'],
          shoes: '—', bag: '—', jewellery: '—', wig: '—',
          note: 'The API may be temporarily unavailable. Tap "Style another" to retry.',
        }],
        verdict: 'TRY AGAIN',
        verdictReason: 'API connection failed',
      });
    }
    setLoading(false);
  };

  // ─── Match wardrobe photos ───
  const findWardrobePhoto = useCallback((pieceName) => {
    if (!pieceName) return null;
    const lower = pieceName.toLowerCase();
    for (const [, items] of Object.entries(wardrobe)) {
      for (const item of items || []) {
        const itemLower = item.name.toLowerCase();
        if (lower.includes(itemLower) || itemLower.includes(lower)) return item;
      }
    }
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    for (const [, items] of Object.entries(wardrobe)) {
      for (const item of items || []) {
        const itemWords = item.name.toLowerCase().split(/\s+/);
        const overlap = words.filter(w => itemWords.some(iw => iw.includes(w) || w.includes(iw)));
        if (overlap.length >= 2) return item;
      }
    }
    return null;
  }, [wardrobe]);

  // ═══════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════

  // ─── HOME ───
  if (screen === 'home') {
    return (
      <div className="container">
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.logo}>S<span style={s.logoDot}>.</span></div>
            <div style={s.logoSub}>LISA'S PERSONAL STYLIST</div>
          </div>
          <div style={s.profileBtn}>L</div>
        </div>

        {/* Weather */}
        {weather && (
          <div style={s.weatherBar}>
            ☁ {weather.temp}° · Dublin · {weatherDesc(weather.code)}
          </div>
        )}

        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.heroTitle}>
            What are you<br />wearing <em style={s.heroAccent}>today</em>?
          </h1>
          <p style={s.heroSub}>
            {totalPieces > 0
              ? `${totalPieces} pieces in your wardrobe. Style any item with your real photos.`
              : 'Build your visual wardrobe, then style any item with your actual pieces.'}
          </p>
        </div>

        {/* Stats */}
        <div style={s.section}>
          <div style={s.statsRow}>
            <div style={s.statBox}>
              <span style={s.statNum}>{totalPieces}</span>
              <span style={s.statLabel}>pieces</span>
            </div>
            <div style={s.statBox}>
              <span style={s.statNum}>{filledCategories}</span>
              <span style={s.statLabel}>categories</span>
            </div>
          </div>
        </div>

        {/* Main actions */}
        <div style={s.section}>
          <button style={s.primaryBtn} onClick={() => setScreen('style-pick')}>
            <span style={{ fontSize: 20 }}>📸</span>
            <div style={{ textAlign: 'left' }}>
              <div style={s.btnTitle}>Style an item</div>
              <div style={s.btnDesc}>Photo or pick from wardrobe → 3 styled looks</div>
            </div>
          </button>

          <button style={s.secondaryBtn} onClick={() => setScreen('wardrobe')}>
            <span style={{ fontSize: 20 }}>🗂️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={s.btnTitle}>My Wardrobe</div>
              <div style={s.btnDesc}>
                {totalPieces > 0
                  ? `${totalPieces} pieces across ${filledCategories} categories`
                  : 'Add your first piece'}
              </div>
            </div>
          </button>
        </div>

        {/* Recent additions */}
        {totalPieces > 0 && (
          <div style={s.section}>
            <div style={s.secLabel}>RECENT ADDITIONS</div>
            <div style={s.previewGrid}>
              {Object.values(wardrobe)
                .flat()
                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                .slice(0, 6)
                .map(item => (
                  <div key={item.id} style={s.previewThumb}>
                    <img src={item.image} alt={item.name} style={s.previewImg} />
                    <span style={s.previewName}>{item.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── WARDROBE: Category list ───
  if (screen === 'wardrobe' && !selectedCategory) {
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => setScreen('home')}>← Home</button>
          <h2 style={s.pageTitle}>My Wardrobe</h2>
          <div style={s.catList}>
            {CATEGORIES.map(cat => {
              const count = wardrobe[cat.id]?.length || 0;
              return (
                <button key={cat.id} style={s.catCard} onClick={() => setSelectedCategory(cat.id)}>
                  <span style={{ fontSize: 26 }}>{cat.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={s.catName}>{cat.label}</div>
                    <div style={s.catCount}>{count} {count === 1 ? 'piece' : 'pieces'}</div>
                  </div>
                  <span style={{ color: 'var(--dim)' }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── WARDROBE: Category items ───
  if (screen === 'wardrobe' && selectedCategory) {
    const items = wardrobe[selectedCategory] || [];
    const catInfo = CATEGORIES.find(c => c.id === selectedCategory);
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => { setSelectedCategory(null); setAddingItem(false); }}>
            ← Categories
          </button>
          <h2 style={s.pageTitle}>{catInfo?.icon} {catInfo?.label}</h2>

          {/* Add form */}
          {addingItem ? (
            <div style={s.addForm}>
              {itemImage ? (
                <div style={s.photoUploadArea} onClick={() => fileRef.current?.click()}>
                  <img src={itemImage} alt="Preview" style={s.uploadPreview} />
                </div>
              ) : (
                <div style={s.photoOptions}>
                  <button style={s.photoOptionBtn} onClick={() => cameraRef.current?.click()}>
                    <span style={{ fontSize: 26 }}>📸</span>
                    <span style={s.photoOptionLabel}>Take photo</span>
                  </button>
                  <button style={s.photoOptionBtn} onClick={() => fileRef.current?.click()}>
                    <span style={{ fontSize: 26 }}>🖼️</span>
                    <span style={s.photoOptionLabel}>From gallery</span>
                  </button>
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, (f) => { setItemFile(f); const r = new FileReader(); r.onload = (ev) => setItemImage(ev.target.result); r.readAsDataURL(f); })} />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, (f) => { setItemFile(f); const r = new FileReader(); r.onload = (ev) => setItemImage(ev.target.result); r.readAsDataURL(f); })} />

              <input
                style={s.textInput}
                placeholder="Name this piece (e.g. Rust cable knit cropped sweater)"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ ...s.saveBtn, opacity: itemName && itemFile ? 1 : 0.4 }}
                  onClick={handleAddItem}
                  disabled={!itemName || !itemFile}
                >
                  Save to wardrobe
                </button>
                <button style={s.cancelBtn} onClick={() => { setAddingItem(false); setItemName(''); setItemImage(null); setItemFile(null); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button style={s.addItemBtn} onClick={() => setAddingItem(true)}>
              + Add {catInfo?.label?.toLowerCase()}
            </button>
          )}

          {/* Items */}
          {items.length === 0 && !addingItem ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 44 }}>{catInfo?.icon}</span>
              <p style={{ color: 'var(--muted)', marginTop: 12 }}>No {catInfo?.label?.toLowerCase()} yet</p>
              <p style={{ color: 'var(--dim)', fontSize: 13 }}>Tap + to add your first piece</p>
            </div>
          ) : (
            <div style={s.itemsGrid}>
              {items.map(item => (
                <div key={item.id} style={s.itemCard}>
                  <img src={item.image} alt={item.name} style={s.itemImg}
                    onClick={() => {
                      setStyleItem({ image: item.image, name: item.name, category: selectedCategory });
                      setScreen('style-occasion');
                    }}
                  />
                  <div style={s.itemInfo}>
                    <span style={s.itemName}>{item.name}</span>
                    <div style={s.itemActions}>
                      <button style={s.styleItBtn}
                        onClick={() => {
                          setStyleItem({ image: item.image, name: item.name, category: selectedCategory });
                          setScreen('style-occasion');
                        }}
                      >Style it →</button>
                      <button style={s.deleteBtn} onClick={() => handleDeleteItem(selectedCategory, item.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STYLE: Pick item ───
  if (screen === 'style-pick') {
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => setScreen('home')}>← Home</button>
          <h2 style={s.pageTitle}>Style an item</h2>

          {/* Camera / Gallery */}
          <div style={s.photoPickRow}>
            <button style={s.photoPickBtn} onClick={() => styleCameraRef.current?.click()}>
              <span style={{ fontSize: 26 }}>📸</span>
              <div style={s.btnTitle}>Take photo</div>
              <div style={s.btnDesc}>Open camera</div>
            </button>
            <button style={s.photoPickBtn} onClick={() => styleFileRef.current?.click()}>
              <span style={{ fontSize: 26 }}>🖼️</span>
              <div style={s.btnTitle}>From gallery</div>
              <div style={s.btnDesc}>Pick a photo</div>
            </button>
          </div>
          <input ref={styleCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, (f) => { const r = new FileReader(); r.onload = (ev) => { setStyleItem({ image: ev.target.result, name: '', category: '' }); setScreen('style-name'); }; r.readAsDataURL(f); })} />
          <input ref={styleFileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, (f) => { const r = new FileReader(); r.onload = (ev) => { setStyleItem({ image: ev.target.result, name: '', category: '' }); setScreen('style-name'); }; r.readAsDataURL(f); })} />

          {/* Pick from wardrobe */}
          {totalPieces > 0 && (
            <>
              <div style={s.divider}><span style={s.dividerText}>or pick from your wardrobe</span></div>
              {CATEGORIES.filter(cat => wardrobe[cat.id]?.length > 0).map(cat => (
                <div key={cat.id} style={{ marginBottom: 16 }}>
                  <div style={s.secLabel}>{cat.icon} {cat.label.toUpperCase()}</div>
                  <div style={s.pickGrid}>
                    {(wardrobe[cat.id] || []).map(item => (
                      <button key={item.id} style={s.pickThumb}
                        onClick={() => {
                          setStyleItem({ image: item.image, name: item.name, category: cat.id });
                          setScreen('style-occasion');
                        }}
                      >
                        <img src={item.image} alt={item.name} style={s.pickImg} />
                        <span style={s.pickName}>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── STYLE: Name item (for new photos) ───
  if (screen === 'style-name') {
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => setScreen('style-pick')}>← Back</button>
          <h2 style={s.pageTitle}>What is this?</h2>
          {styleItem?.image && (
            <img src={styleItem.image} alt="Item" style={s.namePreview} />
          )}
          <input style={s.textInput} placeholder="e.g. Olive henley top" value={styleItem?.name || ''}
            onChange={e => setStyleItem(prev => ({ ...prev, name: e.target.value }))} />
          <select style={s.selectInput} value={styleItem?.category || ''}
            onChange={e => setStyleItem(prev => ({ ...prev, category: e.target.value }))}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <button
            style={{ ...s.primaryBtnFull, opacity: styleItem?.name && styleItem?.category ? 1 : 0.4, marginTop: 8 }}
            onClick={() => setScreen('style-occasion')}
            disabled={!styleItem?.name || !styleItem?.category}
          >
            NEXT: CHOOSE OCCASION →
          </button>
        </div>
      </div>
    );
  }

  // ─── STYLE: Pick occasion ───
  if (screen === 'style-occasion') {
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => setScreen('style-pick')}>← Back</button>
          <h2 style={s.pageTitle}>Where are you wearing this?</h2>

          {/* Selected item */}
          <div style={s.selectedItemBar}>
            {styleItem?.image && <img src={styleItem.image} alt="" style={s.selectedItemImg} />}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{styleItem?.name}</span>
          </div>

          {/* Occasions */}
          <div style={s.occasionGrid}>
            {OCCASIONS.map(occ => (
              <button key={occ.id}
                style={{ ...s.occasionCard, ...(selectedOccasion === occ.id ? s.occasionActive : {}) }}
                onClick={() => setSelectedOccasion(occ.id)}
              >
                <span style={{ fontSize: 24 }}>{occ.icon}</span>
                <div style={s.occLabel}>{occ.label}</div>
                <div style={s.occDesc}>{occ.desc}</div>
              </button>
            ))}
          </div>

          <button
            style={{ ...s.primaryBtnFull, opacity: selectedOccasion ? 1 : 0.4, marginTop: 8 }}
            onClick={handleStyleRequest}
            disabled={!selectedOccasion}
          >
            ✨ GET 3 STYLED LOOKS
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'result') {
    return (
      <div className="container">
        <div style={s.section}>
          <button style={s.backBtn} onClick={() => { setScreen('home'); setAiResult(null); setStyleItem(null); setSelectedOccasion(null); }}>
            ← Home
          </button>

          {loading ? (
            <div style={s.loadingState}>
              <div style={s.spinnerWrap}>
                <div style={s.spinnerOuter} />
                <div style={s.spinnerInner} />
              </div>
              <p style={{ color: 'var(--muted)', marginTop: 20, fontSize: 14 }}>{loadingMsg}</p>
              <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 6 }}>
                Styling {styleItem?.name} for {OCCASIONS.find(o => o.id === selectedOccasion)?.label}
              </p>
            </div>
          ) : aiResult ? (
            <>
              {/* Verdict */}
              <div style={{
                ...s.verdictBanner,
                background: aiResult.verdict === 'WEAR IT' ? 'var(--green-bg)' : aiResult.verdict === 'BUY IT' ? 'var(--amber-bg)' : 'var(--red-bg)',
                borderColor: aiResult.verdict === 'WEAR IT' ? 'var(--green)' : aiResult.verdict === 'BUY IT' ? '#5a3a1a' : '#5a1a1a',
              }}>
                <div style={s.verdictText}>{aiResult.verdict}</div>
                <div style={s.verdictReason}>{aiResult.verdictReason}</div>
              </div>

              {/* Looks */}
              {aiResult.looks?.map((look, i) => (
                <div key={i} style={s.lookCard}>
                  <div style={s.lookHeader}>
                    <div style={s.lookNum}>LOOK {i + 1}</div>
                    <div style={s.lookName}>{look.name}</div>
                  </div>

                  {/* Pieces with photo matching */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={s.lookLabel}>PIECES</div>
                    {look.pieces?.map((piece, j) => {
                      const match = findWardrobePhoto(piece);
                      return (
                        <div key={j} style={s.pieceRow}>
                          {match ? (
                            <img src={match.image} alt={match.name} style={s.pieceThumb} />
                          ) : (
                            <div style={s.pieceThumbEmpty}>🛒</div>
                          )}
                          <span style={s.pieceText}>{piece}</span>
                          {match && <span style={s.ownedBadge}>owned</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Details */}
                  <div style={s.lookDetails}>
                    {[
                      { icon: '👟', label: 'Shoes', value: look.shoes },
                      { icon: '👜', label: 'Bag', value: look.bag },
                      { icon: '💍', label: 'Jewellery', value: look.jewellery },
                      { icon: '💇‍♀️', label: 'Wig', value: look.wig },
                    ].map((d, k) => {
                      const match = findWardrobePhoto(d.value);
                      return (
                        <div key={k} style={s.detailRow}>
                          <span style={s.detailIcon}>{d.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={s.detailLabel}>{d.label}</div>
                            <div style={s.detailValue}>{d.value}</div>
                          </div>
                          {match && <img src={match.image} alt="" style={s.detailThumb} />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stylist note */}
                  <div style={s.stylistNote}>
                    <span style={{ fontSize: 13 }}>💬</span>
                    <span style={s.noteText}>{look.note}</span>
                  </div>
                </div>
              ))}

              {/* Try another */}
              <button style={s.ghostBtn} onClick={() => { setAiResult(null); setStyleItem(null); setSelectedOccasion(null); setScreen('style-pick'); }}>
                STYLE ANOTHER ITEM
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const s = {
  header: {
    padding: '20px 20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    background: 'linear-gradient(180deg, #141210, var(--bg))',
  },
  logo: {
    fontFamily: 'var(--serif)',
    fontSize: 34,
    fontWeight: 300,
    lineHeight: 1,
    letterSpacing: 2,
    color: 'var(--text)',
  },
  logoDot: { color: 'var(--gold)', fontWeight: 700 },
  logoSub: {
    fontSize: 8,
    color: 'var(--muted)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  profileBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--gold), var(--gold-l))',
    border: 'none', color: 'var(--bg)',
    fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  weatherBar: {
    padding: '10px 20px',
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--card)',
    borderBottom: '1px solid var(--border)',
    fontSize: 12, color: 'var(--muted)',
  },
  hero: { padding: '28px 20px 8px' },
  heroTitle: {
    fontFamily: 'var(--serif)',
    fontSize: 36, fontWeight: 300, lineHeight: 1.1,
    letterSpacing: -0.5,
  },
  heroAccent: { color: 'var(--gold)', fontStyle: 'italic', fontWeight: 500 },
  heroSub: {
    color: 'var(--muted)', fontSize: 13, marginTop: 14, lineHeight: 1.6,
  },
  section: { padding: '16px 20px' },
  secLabel: {
    fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 3, color: 'var(--dim)', marginBottom: 12,
  },
  statsRow: { display: 'flex', gap: 12, marginBottom: 8 },
  statBox: {
    flex: 1, background: 'var(--card)', borderRadius: 12,
    padding: '14px 12px', textAlign: 'center',
    border: '1px solid var(--border)',
  },
  statNum: {
    display: 'block', fontSize: 28, fontWeight: 300,
    color: 'var(--gold)', fontFamily: 'var(--serif)',
  },
  statLabel: {
    fontSize: 10, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  primaryBtn: {
    width: '100%', padding: '16px 18px',
    background: 'var(--card)',
    border: '1.5px solid var(--gold)', borderRadius: 14,
    color: 'var(--text)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 10,
  },
  secondaryBtn: {
    width: '100%', padding: '16px 18px',
    background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 14,
    color: 'var(--text)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 10,
  },
  primaryBtnFull: {
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, var(--gold), var(--gold-l))',
    color: 'var(--bg)', fontFamily: 'var(--sans)',
    fontSize: 13, fontWeight: 600, letterSpacing: 2,
    cursor: 'pointer',
  },
  ghostBtn: {
    width: '100%', padding: 16, borderRadius: 14,
    border: '1.5px solid var(--gold)', background: 'transparent',
    color: 'var(--gold)', fontFamily: 'var(--sans)',
    fontSize: 13, fontWeight: 600, letterSpacing: 2,
    cursor: 'pointer', marginTop: 8,
  },
  btnTitle: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  btnDesc: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--gold)',
    fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', padding: 0, marginBottom: 16,
  },
  pageTitle: {
    fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300,
    marginBottom: 20,
  },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  previewThumb: {
    borderRadius: 10, overflow: 'hidden',
    background: 'var(--card)', border: '1px solid var(--border)',
  },
  previewImg: { width: '100%', height: 100, objectFit: 'cover', display: 'block' },
  previewName: {
    display: 'block', fontSize: 10, padding: '4px 6px 6px',
    color: 'var(--muted)', lineHeight: 1.2,
  },
  catList: { display: 'flex', flexDirection: 'column', gap: 6 },
  catCard: {
    width: '100%', padding: '14px 16px',
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 12, color: 'var(--text)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
  },
  catName: { fontSize: 15, fontWeight: 500 },
  catCount: { fontSize: 12, color: 'var(--muted)' },
  addForm: {
    background: 'var(--card)', borderRadius: 14, padding: 16,
    marginBottom: 16, border: '1px solid var(--border)',
  },
  photoOptions: { display: 'flex', gap: 10, marginBottom: 12 },
  photoOptionBtn: {
    flex: 1, height: 110, borderRadius: 12,
    border: '2px dashed var(--border)', background: 'var(--bg)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, cursor: 'pointer', color: 'var(--text)',
  },
  photoOptionLabel: { fontSize: 12, color: 'var(--muted)' },
  photoUploadArea: {
    width: '100%', height: 180, borderRadius: 10,
    overflow: 'hidden', cursor: 'pointer', marginBottom: 12,
    background: 'var(--bg)', border: '1px solid var(--border)',
  },
  uploadPreview: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  textInput: {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg)', border: '1.5px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 14,
    marginBottom: 10, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--sans)',
  },
  selectInput: {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg)', border: '1.5px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 14,
    marginBottom: 10, outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none', fontFamily: 'var(--sans)',
  },
  saveBtn: {
    flex: 1, padding: 12,
    background: 'linear-gradient(135deg, var(--gold), var(--gold-l))',
    border: 'none', borderRadius: 10,
    color: 'var(--bg)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--sans)',
  },
  cancelBtn: {
    padding: '12px 18px', background: 'var(--border)',
    border: 'none', borderRadius: 10,
    color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
  },
  addItemBtn: {
    width: '100%', padding: 14,
    background: 'transparent', border: '1.5px dashed var(--gold)',
    borderRadius: 12, color: 'var(--gold)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 16,
  },
  emptyState: { textAlign: 'center', padding: '48px 20px' },
  itemsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  itemCard: {
    background: 'var(--card)', borderRadius: 12,
    overflow: 'hidden', border: '1px solid var(--border)',
  },
  itemImg: { width: '100%', height: 160, objectFit: 'cover', cursor: 'pointer', display: 'block' },
  itemInfo: { padding: '8px 10px 10px' },
  itemName: {
    fontSize: 12, fontWeight: 500, color: 'var(--text)',
    display: 'block', marginBottom: 6, lineHeight: 1.3,
  },
  itemActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  styleItBtn: {
    background: 'none', border: 'none', color: 'var(--gold)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
    fontFamily: 'var(--sans)',
  },
  deleteBtn: {
    background: 'none', border: 'none', color: 'var(--dim)',
    fontSize: 14, cursor: 'pointer', padding: '2px 6px',
  },
  photoPickRow: { display: 'flex', gap: 10, marginBottom: 16 },
  photoPickBtn: {
    flex: 1, padding: '18px 12px',
    background: 'var(--card)', border: '1.5px solid var(--gold)',
    borderRadius: 14, color: 'var(--text)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6, textAlign: 'center',
  },
  divider: { textAlign: 'center', margin: '12px 0 20px', position: 'relative' },
  dividerText: {
    fontSize: 11, color: 'var(--dim)',
    background: 'var(--bg)', padding: '0 12px',
  },
  pickGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  pickThumb: {
    borderRadius: 10, overflow: 'hidden',
    background: 'var(--card)', border: '1px solid var(--border)',
    cursor: 'pointer', textAlign: 'left',
  },
  pickImg: { width: '100%', height: 100, objectFit: 'cover', display: 'block' },
  pickName: {
    display: 'block', fontSize: 10, padding: '4px 6px 6px',
    color: 'var(--muted)', lineHeight: 1.2,
  },
  namePreview: {
    width: '100%', maxHeight: 260, objectFit: 'contain',
    borderRadius: 12, marginBottom: 16, background: 'var(--card)',
    border: '1px solid var(--border)',
  },
  selectedItemBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', background: 'var(--card)',
    borderRadius: 12, marginBottom: 16,
    border: '1px solid var(--border)',
  },
  selectedItemImg: { width: 52, height: 52, borderRadius: 10, objectFit: 'cover' },
  occasionGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
    marginBottom: 8,
  },
  occasionCard: {
    padding: '14px 8px', background: 'var(--card)',
    border: '2px solid var(--border)', borderRadius: 12,
    color: 'var(--text)', cursor: 'pointer', textAlign: 'center',
  },
  occasionActive: {
    borderColor: 'var(--gold)',
    background: 'var(--gold-p)',
  },
  occLabel: { fontSize: 13, fontWeight: 600, marginTop: 4 },
  occDesc: { fontSize: 10, color: 'var(--muted)', marginTop: 2 },
  loadingState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '100px 40px', textAlign: 'center',
  },
  spinnerWrap: { position: 'relative', width: 56, height: 56 },
  spinnerOuter: {
    position: 'absolute', inset: 0,
    border: '2px solid var(--border)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  spinnerInner: {
    position: 'absolute', inset: 6,
    border: '2px solid var(--border)',
    borderBottomColor: 'var(--gold-l)',
    borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse',
  },
  verdictBanner: {
    padding: '16px 18px', borderRadius: 14,
    border: '1px solid', marginBottom: 16, textAlign: 'center',
  },
  verdictText: {
    fontSize: 20, fontWeight: 700, letterSpacing: 3,
    fontFamily: 'var(--sans)', marginBottom: 4,
  },
  verdictReason: { fontSize: 13, color: 'var(--muted)' },
  lookCard: {
    background: 'var(--card)', borderRadius: 16, padding: 18,
    marginBottom: 14, border: '1px solid var(--border)',
  },
  lookHeader: {
    marginBottom: 14, borderBottom: '1px solid var(--border)',
    paddingBottom: 10,
  },
  lookNum: {
    fontSize: 9, color: 'var(--gold)',
    textTransform: 'uppercase', letterSpacing: 3,
    fontWeight: 700, marginBottom: 2,
  },
  lookName: { fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400 },
  lookLabel: {
    fontSize: 9, color: 'var(--dim)',
    textTransform: 'uppercase', letterSpacing: 2,
    marginBottom: 8, fontWeight: 700,
  },
  pieceRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 0', borderBottom: '1px solid var(--bg)',
  },
  pieceThumb: {
    width: 42, height: 42, borderRadius: 8,
    objectFit: 'cover', border: '1px solid var(--border)',
    flexShrink: 0,
  },
  pieceThumbEmpty: {
    width: 42, height: 42, borderRadius: 8,
    background: 'var(--bg)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  pieceText: { fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 },
  ownedBadge: {
    fontSize: 9, color: '#6a9a6a',
    background: 'var(--green-bg)', padding: '2px 8px',
    borderRadius: 6, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 0.5,
    flexShrink: 0,
  },
  lookDetails: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 },
  detailRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '4px 0',
  },
  detailIcon: { fontSize: 15, width: 22, textAlign: 'center', marginTop: 2 },
  detailLabel: {
    fontSize: 9, color: 'var(--dim)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  detailValue: { fontSize: 13, color: 'var(--text)', marginTop: 1, lineHeight: 1.4 },
  detailThumb: {
    width: 38, height: 38, borderRadius: 8,
    objectFit: 'cover', border: '1px solid var(--border)',
    flexShrink: 0,
  },
  stylistNote: {
    display: 'flex', gap: 8, padding: '12px 14px',
    background: 'var(--gold-p)', borderRadius: 12,
    border: '1px solid rgba(196,150,74,0.15)',
  },
  noteText: {
    fontSize: 13, color: 'var(--gold-l)', lineHeight: 1.5,
    fontStyle: 'italic', flex: 1,
  },
};
