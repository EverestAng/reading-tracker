import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import ePub from 'epubjs';

export default function App() {
  const [view, setView] = useState('landing');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // States for Internet Book Search (Open Library API)
  const [searchQuery, setSearchQuery] = useState('');
  const [internetBooks, setInternetBooks] = useState([]);
  const [isSearchingNet, setIsSearchingNet] = useState(false);

  // Reader States (Using Local File / ArrayBuffer)
  const [activeBookData, setActiveBookData] = useState(null);
  const [activeBookTitle, setActiveBookTitle] = useState('');
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);

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
    if (error) {
      console.error('Error fetching users:', error);
    } else if (data && data.length > 0) {
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

  // Search books using Open Library API
  async function searchInternetBooks(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingNet(true);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=6`);
      const data = await res.json();
      
      if (data.docs && data.docs.length > 0) {
        const formattedBooks = data.docs.map(item => ({
          title: item.title || 'No Title',
          author: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
          pages: item.number_of_pages_median || 0,
          thumbnail: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : ''
        }));
        setInternetBooks(formattedBooks);
      } else {
        setInternetBooks([]);
      }
    } catch (err) {
      console.error('Error searching books:', err);
      alert('An error occurred while searching books from the internet.');
    } finally {
      setIsSearchingNet(false);
    }
  }

  // Save selected book to Supabase
  async function addBookFromInternet(book) {
    if (!selectedUser) return alert('Please select a user profile first!');

    const { data, error } = await supabase
      .from('books')
      .insert([{
        user_id: selectedUser.id,
        title: book.title,
        author: book.author,
        pages: book.pages,
        status: 'Want to Read'
      }])
      .select();

    if (error) {
      alert('Error adding book: ' + error.message);
    } else if (data) {
      setBooks([data[0], ...books]);
      alert(`Successfully added "${book.title}" to your library!`);
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

  // Handle local EPUB file upload for a specific book
  function handleFileUpload(book, event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.epub')) {
      alert('Please upload a valid .epub file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      setActiveBookTitle(book.title);
      setActiveBookData(arrayBuffer);
      setView('reader');
    };
    reader.readAsArrayBuffer(file);
  }

  // Initialize EPUB.js with local ArrayBuffer data
  useEffect(() => {
    if (view === 'reader' && activeBookData && viewerRef.current) {
      viewerRef.current.innerHTML = '';
      
      const book = ePub(activeBookData);
      book.ready.then(() => {
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "always"
        });
        rendition.display();
        renditionRef.current = rendition;
        bookRef.current = book;
      }).catch(err => {
        console.error("Error loading local EPUB:", err);
        viewerRef.current.innerHTML = `<div style="padding: 20px; text-align: center; color: #a83232;">Error parsing EPUB file format. Make sure it's a valid ebook.</div>`;
      });
    }
  }, [view, activeBookData]);

  function nextPage() {
    if (renditionRef.current) renditionRef.current.next();
  }

  function prevPage() {
    if (renditionRef.current) renditionRef.current.prev();
  }

  const totalBooks = books.length;
  const currentlyReadingCount = books.filter(b => b.status === 'Currently Reading').length;
  const completedCount = books.filter(b => b.status === 'Completed').length;
  const wantToReadCount = books.filter(b => b.status === 'Want to Read').length;

  const filteredBooks = books.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });

  const currentName = selectedUser?.name || users[0]?.name || 'Account';
  const currentEmail = selectedUser?.email || users[0]?.email || 'No email registered';

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
          onClick={() => {
            if (view === 'tracker') return;
            setView('landing');
          }}
          style={{ fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#2c2925' }}
        >
          <span>📚</span>
          <span>PageFlow</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
          {view === 'landing' ? (
            <>
              <button onClick={() => setView('login')} style={{ background: 'transparent', border: '1px solid #d4c5b9', padding: '8px 16px', borderRadius: '6px', color: '#5c4033', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Log In</button>
              <button onClick={() => setView('register')} style={{ padding: '8px 18px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Register</button>
            </>
          ) : view === 'reader' ? (
            <button onClick={() => setView('tracker')} style={{ padding: '8px 16px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>← Back to Dashboard</button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ padding: '8px 16px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤 {currentName}</span>
                <span style={{ fontSize: '0.75rem' }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '42px', background: '#fffbf7', border: '1px solid #d4c5b9', borderRadius: '8px', boxShadow: '0 8px 20px rgba(44,41,37,0.15)', width: '240px', zIndex: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee6dc', background: '#f7f4ef' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8c7b6c', fontWeight: '600' }}>Signed in as</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c2925', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentEmail}</div>
                  </div>
                  <button onClick={() => { setDropdownOpen(false); setView('landing'); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#a83232', fontWeight: '600' }}>🚪 Log Out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* BUILT-IN E-READER VIEW */}
      {view === 'reader' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 73px)', background: '#fffbf7' }}>
          <div style={{ padding: '12px 24px', background: '#ede7df', borderBottom: '1px solid #d4c5b9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#5c4033' }}>📖 Reading: {activeBookTitle}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={prevPage} style={{ padding: '6px 14px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>← Prev Page</button>
              <button onClick={nextPage} style={{ padding: '6px 14px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Next Page →</button>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', width: '100%', maxWidth: '850px', margin: '0 auto', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      )}

      {/* LANDING PAGE VIEW */}
      {view === 'landing' && (
        <main style={{ flex: 1, padding: '90px 8%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#2c2925', marginBottom: '20px' }}>Read and Track Books in One Place.</h1>
          <p style={{ fontSize: '1.1rem', color: '#5e564f', marginBottom: '32px' }}>A cozy digital sanctuary equipped with a built-in local e-reader and reading progress tracker.</p>
          <button onClick={() => setView('register')} style={{ padding: '14px 28px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>Get Started →</button>
        </main>
      )}

      {/* LOGIN PAGE VIEW */}
      {view === 'login' && (
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f7f4ef', minHeight: 'calc(100vh - 73px)' }}>
          <div style={{ padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#2c2925', marginBottom: '8px' }}>Welcome back</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>Email Address or Name *</label>
                <input type="text" placeholder="e.g. yourname@gmail.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>Password *</label>
                <input type="password" placeholder="••••••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
              </div>
              <button type="submit" style={{ padding: '14px', background: '#2c2925', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>Log In</button>
            </form>
          </div>
        </main>
      )}

      {/* REGISTER PAGE VIEW */}
      {view === 'register' && (
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f7f4ef', minHeight: 'calc(100vh - 73px)' }}>
          <div style={{ padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#2c2925', marginBottom: '8px' }}>Create Account</h1>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>Your Name *</label>
                <input type="text" placeholder="e.g. Everest Ang" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>Email Address *</label>
                <input type="email" placeholder="e.g. yourname@gmail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#2c2925', marginBottom: '6px' }}>Password *</label>
                <input type="password" placeholder="••••••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
              </div>
              <button type="submit" style={{ padding: '14px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>Register & Start Reading</button>
            </form>
          </div>
        </main>
      )}

      {/* DASHBOARD & LIBRARY VIEW */}
      {view === 'tracker' && (
        <div style={{ maxWidth: '1000px', width: '100%', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#ede7df', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#8c7b6c', fontWeight: '600', textTransform: 'uppercase' }}>Dashboard</span>
              <h2 style={{ color: '#5c4033', margin: '4px 0 0 0', fontSize: '1.8rem' }}>Welcome back, {currentName}! 📖</h2>
            </div>
          </div>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* INTERNET SEARCH */}
              <div style={{ background: '#ede7df', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#5c4033', marginBottom: '12px' }}>🔍 Search Books on the Internet</h3>
                <form onSubmit={searchInternetBooks} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input type="text" placeholder="Type book title or author..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '12px 14px', background: '#fffbf7', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '8px', outline: 'none' }} />
                  <button type="submit" style={{ padding: '12px 24px', background: '#5c4033', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>{isSearchingNet ? 'Searching...' : 'Search'}</button>
                </form>

                {internetBooks.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                    {internetBooks.map((b, idx) => (
                      <div key={idx} style={{ background: '#fffbf7', padding: '12px', borderRadius: '8px', border: '1px solid #d4c5b9', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {b.thumbnail ? (
                          <img src={b.thumbnail} alt={b.title} style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d4c5b9' }} />
                        ) : (
                          <div style={{ width: '50px', height: '70px', background: '#eee6dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', borderRadius: '4px' }}>📚</div>
                        )}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', color: '#2c2925', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</h4>
                          <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#5e564f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.author}</p>
                          <button onClick={() => addBookFromInternet(b)} style={{ padding: '5px 10px', background: '#3b7a57', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>+ Add to Library</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MY LIBRARY & LOCAL READER UPLOAD */}
              <div style={{ background: '#f7f4ef', padding: '24px', borderRadius: '12px', border: '1px solid #d4c5b9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2c2925' }}>My Library & Local E-Reader</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['All', 'Want to Read', 'Currently Reading', 'Completed'].map(tab => (
                      <button key={tab} onClick={() => setFilterStatus(tab)} style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', background: filterStatus === tab ? '#5c4033' : '#ede7df', color: filterStatus === tab ? '#fff' : '#5e564f', border: '1px solid #d4c5b9' }}>{tab}</button>
                    ))}
                  </div>
                </div>

                {filteredBooks.length === 0 ? (
                  <p style={{ color: '#5e564f', fontSize: '0.95rem', textAlign: 'center', padding: '30px 0' }}>No books found. Search above to add some!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredBooks.map(book => (
                      <div key={book.id} style={{ background: '#fffbf7', padding: '14px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', border: '1px solid #d4c5b9' }}>
                        <div>
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '1.05rem', color: '#2c2925' }}>{book.title}</h4>
                          <p style={{ margin: '0 0 6px 0', color: '#5e564f', fontSize: '0.85rem' }}>by {book.author}</p>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: '#eee6dc', color: '#2c2925', fontWeight: '600' }}>{book.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* File Upload for reading */}
                          <label style={{ padding: '6px 12px', background: '#2b5c8f', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
                            📁 Upload & Read EPUB
                            <input type="file" accept=".epub" onChange={(e) => handleFileUpload(book, e)} style={{ display: 'none' }} />
                          </label>

                          <select value={book.status} onChange={(e) => updateStatus(book.id, e.target.value)} style={{ padding: '6px 8px', background: '#f7f4ef', color: '#2c2925', border: '1px solid #d4c5b9', borderRadius: '6px', fontSize: '0.8rem' }}>
                            <option value="Want to Read">Want to Read</option>
                            <option value="Currently Reading">Reading</option>
                            <option value="Completed">Completed</option>
                          </select>
                          
                          <button onClick={() => deleteBook(book.id)} style={{ padding: '6px 10px', background: '#a83232', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Delete</button>
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
        © 2026 PageFlow Reading Platform • Built with React, Vite, Supabase & Epub.js
      </footer>
    </div>
  );
}