import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register', or 'tracker'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [newUsername, setNewUsername] = useState('');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Form states for new book
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

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail.trim()) {
      alert('Please enter your email or username.');
      return;
    }
    setView('tracker');
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ username: regUsername }])
      .select();

    if (error) {
      alert('Error registering user: ' + error.message);
    } else if (data && data.length > 0) {
      setUsers([...users, data[0]]);
      setSelectedUser(data[0]);
      alert('Registration successful! Welcome to PageFlow.');
      setView('tracker');
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
    if (!selectedUser) return alert('Please select or create a user first!');
    if (!title.trim() || !author.trim()) return alert('Please provide both title and author.');

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
        background: '#ede7df',
        borderBottom: '1px solid #dcd4cc',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div
          onClick={() => setView('landing')}
          style={{ fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#2c2925' }}
        >
          <span>📚</span>
          <span>PageFlow</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {view === 'landing' ? (
            <>
              <button
                onClick={() => setView('login')}
                style={{
                  background: 'transparent',
                  border: '1px solid #d4c5b9',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  color: '#5c4033',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Log In
              </button>
              <button
                onClick={() => setView('register')}
                className="cta-btn"
                style={{
                  padding: '8px 18px',
                  background: '#5c4033',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Register
              </button>
            </>
          ) : (
            <button
              onClick={() => setView('landing')}
              style={{
                padding: '8px 16px',
                background: '#eee6dc',
                color: '#2c2925',
                border: '1px solid #d4c5b9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              ← Back to Home
            </button>
          )}
        </div>
      </nav>

      {/* LANDING PAGE VIEW */}
      {view === 'landing' && (
        <main style={{ flex: 1 }}>
          <section style={{
            position: 'relative',
            padding: '90px 8%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f7f4ef 0%, #eee6dc 100%)'
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '6px 14px',
                background: '#e4dacf',
                color: '#5c4033',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '18px',
                border: '1px solid #d4c5b9'
              }}>
                ✨ Eye-Friendly Digital Reading Companion
              </span>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: '800',
                lineHeight: 1.15,
                marginBottom: '20px',
                color: '#2c2925'
              }}>
                Track every page of your reading journey comfortably.
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: '#5e564f',
                marginBottom: '32px',
                maxWidth: '540px'
              }}>
                Organize your reading list, log your book pages, and enjoy a warm, glare-free interface designed to keep your eyes relaxed during long reading sessions.
              </p>

              {/* ISANG GET STARTED BUTTON NA LANG SA BABA NG HERO */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setView('register')}
                  className="cta-btn"
                  style={{
                    padding: '14px 28px',
                    background: '#5c4033',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Get Started →
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(44, 41, 37, 0.15)',
                border: '1px solid #d4c5b9'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
                  alt="Cozy stack of books and reading setup"
                  style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </section>

          <section id="features" style={{ padding: '70px 8%', background: '#eee8e0', borderTop: '1px solid #dcd4cc' }}>
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 50px auto' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '12px', color: '#2c2925' }}>Why Choose PageFlow?</h2>
              <p style={{ color: '#5e564f' }}>Designed with cozy typography and soft color tones for a soothing reading experience.</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px'
            }}>
              <div className="feature-card" style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
                <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80" alt="Library" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#2c2925' }}>Organized Collection</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>Seamlessly sort your books into different reading statuses.</p>
                </div>
              </div>

              <div className="feature-card" style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
                <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80" alt="Journal" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#2c2925' }}>Multi-Reader Profiles</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>Create custom reader profiles within a single workspace.</p>
                </div>
              </div>

              <div className="feature-card" style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
                <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80" alt="Library interior" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#2c2925' }}>Real-Time Cloud Save</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>Every change is instantly persisted to your database.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* LOGIN PAGE VIEW */}
      {view === 'login' && (
        <main style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f7f4ef',
          minHeight: 'calc(100vh - 73px)'
        }}>
          <div style={{ padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#8c7b6c', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Reader Login
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#2c2925', marginBottom: '8px' }}>
              Welcome back
            </h1>
            <p style={{ color: '#5e564f', marginBottom: '32px', fontSize: '0.95rem' }}>
              Sign in to access your personal reading list and library.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>
                  Email Address or Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5e564f', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#5c4033' }} /> Remember me
                </label>
                <span style={{ color: '#5e564f' }}>
                  Don't have an account? <a href="#register" onClick={(e) => { e.preventDefault(); setView('register'); }} style={{ color: '#5c4033', fontWeight: '700', textDecoration: 'none' }}>Register</a>
                </span>
              </div>

              <button
                type="submit"
                style={{
                  padding: '14px',
                  background: '#2c2925',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Log In
              </button>
            </form>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
            <img
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
              alt="Cozy stack of books"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '40px',
              right: '40px',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px' }}>
                YOUR READING, SIMPLIFIED.
              </h2>
              <p style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                Keep track of every chapter, book, and milestone seamlessly.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* REGISTER PAGE VIEW */}
      {view === 'register' && (
        <main style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f7f4ef',
          minHeight: 'calc(100vh - 73px)'
        }}>
          <div style={{ padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#8c7b6c', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              New Reader
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#2c2925', marginBottom: '8px' }}>
              Create Account
            </h1>
            <p style={{ color: '#5e564f', marginBottom: '32px', fontSize: '0.95rem' }}>
              Sign up to start tracking your reading list in the cloud.
            </p>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>
                  Reader Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. EverestAng"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#5e564f' }}>
                Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); setView('login'); }} style={{ color: '#5c4033', fontWeight: '700', textDecoration: 'none' }}>Log In</a>
              </div>

              <button
                type="submit"
                style={{
                  padding: '14px',
                  background: '#5c4033',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Register & Start Reading
              </button>
            </form>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80"
              alt="Cozy library books stack"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '40px',
              right: '40px',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px' }}>
                YOUR LIBRARY AWAITS.
              </h2>
              <p style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                Create your profile and start logging your favorite books today.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* TRACKER VIEW */}
      {view === 'tracker' && (
        <div style={{ maxWidth: '800px', width: '100%', margin: '40px auto', padding: '24px', background: '#fffbf7', color: '#2c2925', borderRadius: '12px', border: '1px solid #d4c5b9', boxShadow: '0 10px 30px rgba(44,41,37,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#5c4033', margin: 0 }}>📚 My Reading List</h2>
            <button
              onClick={() => setView('landing')}
              style={{ padding: '6px 12px', background: '#eee6dc', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Back to Home
            </button>
          </div>

          {/* User Management Section */}
          <div style={{ background: '#f7f4ef', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #d4c5b9' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#2c2925' }}>Reader Profile</h3>
            {users.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', color: '#5e564f' }}>Select Reader:</label>
                <select
                  value={selectedUser ? selectedUser.id : ''}
                  onChange={(e) => {
                    const found = users.find(u => u.id == e.target.value);
                    setSelectedUser(found);
                  }}
                  style={{ padding: '6px 10px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>No users found in database. Create one below:</p>
            )}

            <form onSubmit={createUser} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="New reader username..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
              />
              <button type="submit" style={{ padding: '8px 16px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Add User
              </button>
            </form>
          </div>

          {selectedUser && (
            <>
              {/* Add Book Form */}
              <form onSubmit={addBook} style={{ background: '#f7f4ef', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #d4c5b9' }}>
                <h3 style={{ fontSize: '1rem', color: '#2c2925' }}>Add a New Book for {selectedUser.username}</h3>
                <input
                  type="text"
                  placeholder="Book Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={{ padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Total Pages"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                  >
                    <option value="Want to Read">Want to Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '11px', background: '#3b7a57', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                  + Save Book
                </button>
              </form>

              {/* Book List */}
              <div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.05rem', color: '#2c2925' }}>Book List ({books.length})</h3>
                {books.length === 0 ? (
                  <p style={{ color: '#5e564f', fontSize: '0.95rem' }}>No books recorded yet. Add one above!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {books.map(book => (
                      <div key={book.id} style={{ background: '#f7f4ef', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #d4c5b9', borderLeft: `5px solid ${book.status === 'Completed' ? '#3b7a57' : book.status === 'Currently Reading' ? '#2b5c8f' : '#8c7b6c'}` }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#2c2925' }}>{book.title}</h4>
                          <p style={{ margin: '0 0 8px 0', color: '#5e564f', fontSize: '0.9rem' }}>by {book.author} • {book.pages || 0} pages</p>
                          <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#eee6dc', color: '#2c2925' }}>
                            {book.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={book.status}
                            onChange={(e) => updateStatus(book.id, e.target.value)}
                            style={{ padding: '6px 8px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px', fontSize: '0.85rem' }}
                          >
                            <option value="Want to Read">Want to Read</option>
                            <option value="Currently Reading">Reading</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            onClick={() => deleteBook(book.id)}
                            style={{ padding: '6px 12px', background: '#a83232', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                          >
                            Delete
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
      <footer style={{ textAlign: 'center', padding: '24px', color: '#5e564f', fontSize: '0.85rem', borderTop: '1px solid #dcd4cc', marginTop: 'auto' }}>
        © 2026 PageFlow Reading Tracker • Built with React, Vite & Supabase (Eye-Friendly Warm Mode)
      </footer>
    </div>
  );
}