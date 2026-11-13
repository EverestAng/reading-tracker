import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' o 'tracker'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [newUsername, setNewUsername] = useState('');

  // Form states para sa bagong libro
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [status, setStatus] = useState('Want to Read');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchBooks(selectedUser.id);
    } else {
      setBooks([]);
    }
  }, [selectedUser]);

  async function fetchUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Error fetching users:', error);
    else if (data && data.length > 0) {
      setUsers(data);
      setSelectedUser(data[0]);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const { data, error } = await supabase
      .from('users')
      .insert([{ username: newUsername }])
      .select();

    if (error) {
      alert('Error adding user: ' + error.message);
    } else if (data) {
      setUsers([...users, data[0]]);
      setSelectedUser(data[0]);
      setNewUsername('');
    }
  }

  async function fetchBooks(userId) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId);
    if (error) console.error('Error fetching books:', error);
    else setBooks(data || []);
  }

  async function addBook(e) {
    e.preventDefault();
    if (!selectedUser) return alert('Pumili muna o gumawa ng user!');
    if (!title.trim() || !author.trim()) return alert('Lagyan ng title at author ang libro.');

    const { data, error } = await supabase
      .from('books')
      .insert([{
        user_id: selectedUser.id,
        title,
        author,
        pages: parseInt(pages) || 0,
        status
      }])
      .select();

    if (error) {
      alert('Error adding book: ' + error.message);
    } else if (data) {
      setBooks([data[0], ...books]);
      setTitle('');
      setAuthor('');
      setPages('');
      setStatus('Want to Read');
    }
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('books')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      setBooks(books.map(b => b.id === id ? { ...b, status: newStatus } : b));
    }
  }

  async function deleteBook(id) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting book: ' + error.message);
    } else {
      setBooks(books.filter(b => b.id !== id));
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 8%',
        background: 'rgba(13, 15, 20, 0.9)',
        borderBottom: '1px solid #1f2430',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)'
      }}>
        <div
          onClick={() => setView('landing')}
          style={{ fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>📚</span>
          <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PageFlow
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button
            onClick={() => setView('landing')}
            style={{
              background: 'transparent',
              border: 'none',
              color: view === 'landing' ? '#818cf8' : '#9ca3af',
              fontWeight: view === 'landing' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Home
          </button>
          <button
            onClick={() => setView('tracker')}
            className="cta-btn"
            style={{
              padding: '8px 18px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            {view === 'tracker' ? 'Nasa Library Ka Na' : 'Buksan ang Library'}
          </button>
        </div>
      </nav>

      {/* LANDING PAGE VIEW */}
      {view === 'landing' ? (
        <main style={{ flex: 1 }}>
          {/* Hero Section */}
          <section style={{
            position: 'relative',
            padding: '90px 8%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            background: 'radial-gradient(circle at top right, rgba(79, 70, 229, 0.15), transparent 50%)'
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '6px 14px',
                background: 'rgba(79, 70, 229, 0.15)',
                color: '#a5b4fc',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '18px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                ✨ Ang Iyong Digital Reading Companion
              </span>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: '800',
                lineHeight: 1.15,
                marginBottom: '20px',
                color: '#ffffff'
              }}>
                Subaybayan ang bawat pahina ng iyong paglalakbay.
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: '#9ca3af',
                marginBottom: '32px',
                maxWidth: '540px'
              }}>
                Ayusin ang iyong mga binabasang libro, itala ang bilang ng pahina, at panatilihing naka-sync sa cloud ang iyong personal na koleksyon kahit saan ka magpunta.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setView('tracker')}
                  className="cta-btn"
                  style={{
                    padding: '14px 28px',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Simulan ang Pagbabasa →
                </button>
                <a
                  href="#features"
                  style={{
                    padding: '14px 24px',
                    background: '#161b26',
                    color: '#e5e7eb',
                    border: '1px solid #2a3142',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Alamin ang Features
                </a>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid #2a3142'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
                  alt="Cozy stack of books and reading setup"
                  style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
                />
              </div>
              {/* Floating Stat Badge */}
              <div style={{
                position: 'absolute',
                bottom: '-18px',
                left: '20px',
                background: '#161b26',
                border: '1px solid #2a3142',
                padding: '14px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.6rem' }}>📖</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>Cloud-Synced Shelf</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Powered by Supabase</div>
                </div>
              </div>
            </div>
          </section>

          {/* Visual Gallery & Features Section */}
          <section id="features" style={{ padding: '70px 8%', background: '#11141c', borderTop: '1px solid #1f2430' }}>
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 50px auto' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '12px' }}>Bakit Gagamit ng PageFlow?</h2>
              <p style={{ color: '#9ca3af' }}>Dinisenyo para maging simple, mabilis, at walang kalat habang pinapayaman mo ang iyong reading habit.</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px'
            }}>
              {/* Card 1 */}
              <div className="feature-card" style={{ background: '#161b26', borderRadius: '12px', overflow: 'hidden', border: '1px solid #232938' }}>
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80"
                  alt="Library bookshelves"
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#fff' }}>Organisadong Koleksyon</h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                    Ihiwalay ang mga librong <em>Want to Read</em>, <em>Currently Reading</em>, at <em>Completed</em> sa isang pindot lang.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="feature-card" style={{ background: '#161b26', borderRadius: '12px', overflow: 'hidden', border: '1px solid #232938' }}>
                <img
                  src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80"
                  alt="Reading journal and coffee"
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#fff' }}>Multi-Reader Profiles</h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                    Gumawa ng sariling profile o magdagdag ng iba pang mambabasa sa iisang workspace nang hindi naghahalo ang listahan.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="feature-card" style={{ background: '#161b26', borderRadius: '12px', overflow: 'hidden', border: '1px solid #232938' }}>
                <img
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80"
                  alt="Classic library interior"
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#fff' }}>Real-Time Cloud Save</h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                    Lahat ng pagbabago ay direktang naka-save sa iyong database kaya hindi mawawala ang progress mo.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* TRACKER VIEW */
        <div style={{ maxWidth: '800px', width: '100%', margin: '40px auto', padding: '24px', background: '#161b26', color: '#e0e0e0', borderRadius: '12px', border: '1px solid #232938' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#818cf8', margin: 0 }}>📚 Aking Reading List</h2>
            <button
              onClick={() => setView('landing')}
              style={{ padding: '6px 12px', background: '#232938', color: '#d1d5db', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Balik sa Home
            </button>
          </div>

          {/* User Management Section */}
          <div style={{ background: '#0d0f14', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #1f2430' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Reader / User Profile</h3>
            {users.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Pumili ng Reader:</label>
                <select
                  value={selectedUser ? selectedUser.id : ''}
                  onChange={(e) => {
                    const found = users.find(u => u.id == e.target.value);
                    setSelectedUser(found);
                  }}
                  style={{ padding: '6px 10px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Wala pang user sa database. Gumawa ng bago sa ibaba:</p>
            )}

            <form onSubmit={createUser} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Bagong pangalan ng user..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
              />
              <button type="submit" style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Magdagdag ng User
              </button>
            </form>
          </div>

          {selectedUser && (
            <>
              {/* Add Book Form */}
              <form onSubmit={addBook} style={{ background: '#0d0f14', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #1f2430' }}>
                <h3 style={{ fontSize: '1rem' }}>Magdagdag ng Bagong Libro para kay {selectedUser.username}</h3>
                <input
                  type="text"
                  placeholder="Pamagat ng Libro (Title)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ padding: '10px 12px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  placeholder="May-akda (Author)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={{ padding: '10px 12px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Bilang ng Pahina (Pages)"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px' }}
                  >
                    <option value="Want to Read">Want to Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                  + I-save ang Libro
                </button>
              </form>

              {/* Book List */}
              <div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.05rem' }}>Listahan ng mga Libro ({books.length})</h3>
                {books.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Wala pang nakatalang libro. Magdagdag sa itaas!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {books.map(book => (
                      <div key={book.id} style={{ background: '#0d0f14', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1f2430', borderLeft: `5px solid ${book.status === 'Completed' ? '#10b981' : book.status === 'Currently Reading' ? '#3b82f6' : '#6b7280'}` }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#fff' }}>{book.title}</h4>
                          <p style={{ margin: '0 0 8px 0', color: '#9ca3af', fontSize: '0.9rem' }}>ni {book.author} • {book.pages || 0} pahina</p>
                          <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#1f2430', color: '#d1d5db' }}>
                            {book.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={book.status}
                            onChange={(e) => updateStatus(book.id, e.target.value)}
                            style={{ padding: '6px 8px', background: '#1f2430', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.85rem' }}
                          >
                            <option value="Want to Read">Want to Read</option>
                            <option value="Currently Reading">Reading</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            onClick={() => deleteBook(book.id)}
                            style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                          >
                            Burahin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '0.85rem', borderTop: '1px solid #1f2430', marginTop: 'auto' }}>
        © 2026 PageFlow Reading Tracker • Built with React, Vite & Supabase
      </footer>
    </div>
  );
}