import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register', or 'tracker'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
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
      if (!selectedUser) setSelectedUser(data[0]);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail.trim()) {
      alert('Please enter your email or name.');
      return;
    }
    const found = users.find(u => u.email === loginEmail || u.name.toLowerCase() === loginEmail.toLowerCase());
    if (found) {
      setSelectedUser(found);
    } else if (users.length > 0) {
      setSelectedUser(users[0]);
    }
    setView('tracker');
    setDropdownOpen(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ name: regName, email: regEmail, password: regPassword }])
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
    if (!selectedUser) return alert('Please select a user profile first!');
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

  const totalBooks = books.length;
  const currentlyReadingCount = books.filter(b => b.status === 'Currently Reading').length;
  const completedCount = books.filter(b => b.status === 'Completed').length;
  const wantToReadCount = books.filter(b => b.status === 'Want to Read').length;

  const filteredBooks = books.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f4ef', color: '#2c2925' }}>
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
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
          ) : view === 'tracker' ? (
            /* DYNAMIC USER ACCOUNT DROPDOWN MENU */
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  padding: '8px 16px',
                  background: '#5c4033',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>👤 {selectedUser ? selectedUser.name : 'Account'}</span>
                <span style={{ fontSize: '0.75rem' }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  background: '#fffbf7',
                  border: '1px solid #d4c5b9',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(44,41,37,0.15)',
                  width: '200px',
                  zIndex: 20,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee6dc', background: '#f7f4ef' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8c7b6c', fontWeight: '600' }}>Signed in as</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#2c2925', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedUser ? selectedUser.name : 'User'}
                    </div>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); alert('Settings feature coming soon!'); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#2c2925', borderBottom: '1px solid #eee6dc' }}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); setView('landing'); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#a83232', fontWeight: '600' }}
                  >
                    🚪 Log Out
                  </button>
                </div>
              )}
            </div>
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

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setView('register')}
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
              <div style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
                <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80" alt="Library" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#2c2925' }}>Organized Collection</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>Seamlessly sort your books into different reading statuses.</p>
                </div>
              </div>

              <div style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
                <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80" alt="Journal" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#2c2925' }}>Multi-Reader Profiles</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5e564f' }}>Create custom reader profiles within a single workspace.</p>
                </div>
              </div>

              <div style={{ background: '#f7f4ef', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4c5b9' }}>
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
                  Email Address or Name *
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
                  Your Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Everest Ang"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
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

      {/* POST-LOGIN DASHBOARD VIEW */}
      {view === 'tracker' && (
        <div style={{ maxWidth: '900px', width: '100%', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Welcome Banner */}
          <div style={{ background: '#ede7df', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#8c7b6c', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard</span>
              <h2 style={{ color: '#5c4033', margin: '4px 0 0 0', fontSize: '1.8rem' }}>
                Welcome back, {selectedUser ? selectedUser.name : 'Reader'}! 📖
              </h2>
            </div>
          </div>

          {/* Quick Stats Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f7f4ef', padding: '20px', borderRadius: '10px', border: '1px solid #d4c5b9', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#5c4033' }}>{totalBooks}</div>
              <div style={{ fontSize: '0.85rem', color: '#5e564f', fontWeight: '600', marginTop: '4px' }}>Total Books</div>
            </div>
            <div style={{ background: '#f7f4ef', padding: '20px', borderRadius: '10px', border: '1px solid #d4c5b9', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2b5c8f' }}>{currentlyReadingCount}</div>
              <div style={{ fontSize: '0.85rem', color: '#5e564f', fontWeight: '600', marginTop: '4px' }}>Currently Reading</div>
            </div>
            <div style={{ background: '#f7f4ef', padding: '20px', borderRadius: '10px', border: '1px solid #d4c5b9', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#3b7a57' }}>{completedCount}</div>
              <div style={{ fontSize: '0.85rem', color: '#5e564f', fontWeight: '600', marginTop: '4px' }}>Completed</div>
            </div>
            <div style={{ background: '#f7f4ef', padding: '20px', borderRadius: '10px', border: '1px solid #d4c5b9', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#8c7b6c' }}>{wantToReadCount}</div>
              <div style={{ fontSize: '0.85rem', color: '#5e564f', fontWeight: '600', marginTop: '4px' }}>Want to Read</div>
            </div>
          </div>

          {selectedUser && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Add New Book Form */}
              <div style={{ background: '#f7f4ef', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#2c2925', marginBottom: '16px' }}>+ Add a New Book</h3>
                <form onSubmit={addBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#5e564f' }}>Book Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Atomic Habits"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#5e564f' }}>Author *</label>
                    <input
                      type="text"
                      placeholder="e.g. James Clear"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#5e564f' }}>Total Pages</label>
                    <input
                      type="number"
                      placeholder="e.g. 320"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#5e564f' }}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px' }}
                    >
                      <option value="Want to Read">Want to Read</option>
                      <option value="Currently Reading">Currently Reading</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <button type="submit" style={{ padding: '12px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', marginTop: '6px' }}>
                    Save Book
                  </button>
                </form>
              </div>

              {/* Right Column: Book List with Status Filter Tabs */}
              <div style={{ background: '#f7f4ef', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2c2925' }}>My Library</h3>
                  
                  {/* Filter Tabs */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['All', 'Want to Read', 'Currently Reading', 'Completed'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterStatus(tab)}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: filterStatus === tab ? '#5c4033' : '#ede7df',
                          color: filterStatus === tab ? '#fff' : '#5e564f',
                          border: '1px solid #d4c5b9'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBooks.length === 0 ? (
                  <p style={{ color: '#5e564f', fontSize: '0.95rem', textAlign: 'center', padding: '40px 0' }}>No books found in this category.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredBooks.map(book => (
                      <div key={book.id} style={{ background: '#fffbf7', padding: '14px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #d4c5b9', borderLeft: `5px solid ${book.status === 'Completed' ? '#3b7a57' : book.status === 'Currently Reading' ? '#2b5c8f' : '#8c7b6c'}` }}>
                        <div>
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '1.05rem', color: '#2c2925' }}>{book.title}</h4>
                          <p style={{ margin: '0 0 6px 0', color: '#5e564f', fontSize: '0.85rem' }}>by {book.author} • {book.pages || 0} pages</p>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: '#eee6dc', color: '#2c2925', fontWeight: '600' }}>
                            {book.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={book.status}
                            onChange={(e) => updateStatus(book.id, e.target.value)}
                            style={{ padding: '6px 8px', background: '#f7f4ef', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px', fontSize: '0.8rem' }}
                          >
                            <option value="Want to Read">Want to Read</option>
                            <option value="Currently Reading">Reading</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            onClick={() => deleteBook(book.id)}
                            style={{ padding: '6px 10px', background: '#a83232', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
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