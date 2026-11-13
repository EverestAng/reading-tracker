import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
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
      setSelectedUser(data[0]); // Piliin ang unang user by default
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
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', background: '#121212', color: '#e0e0e0', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center', color: '#4f46e5' }}>📚 Personal Reading Tracker</h1>

      {/* User Management Section */}
      <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <h3>Reader / User Profile</h3>
        {users.length > 0 ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label>Pumili ng Reader:</label>
            <select 
              value={selectedUser ? selectedUser.id : ''} 
              onChange={(e) => {
                const found = users.find(u => u.id == e.target.value);
                setSelectedUser(found);
              }}
              style={{ padding: '6px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
        ) : (
          <p>Wala pang user sa database. Gumawa ng bago sa ibaba:</p>
        )}

        <form onSubmit={createUser} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input 
            type="text" 
            placeholder="Bagong pangalan ng user..." 
            value={newUsername} 
            onChange={(e) => setNewUsername(e.target.value)}
            style={{ flex: 1, padding: '8px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Magdagdag ng User
          </button>
        </form>
      </div>

      {selectedUser && (
        <>
          {/* Add Book Form */}
          <form onSubmit={addBook} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>Magdagdag ng Bagong Libro para kay {selectedUser.username}</h3>
            <input 
              type="text" 
              placeholder="Pamagat ng Libro (Title)" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: '8px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
            <input 
              type="text" 
              placeholder="May-akda (Author)" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)}
              style={{ padding: '8px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" 
                placeholder="Bilang ng Pahina (Pages)" 
                value={pages} 
                onChange={(e) => setPages(e.target.value)}
                style={{ flex: 1, padding: '8px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ flex: 1, padding: '8px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              >
                <option value="Want to Read">Want to Read</option>
                <option value="Currently Reading">Currently Reading</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              I-save ang Libro
            </button>
          </form>

          {/* Book List */}
          <div>
            <h3>Listahan ng mga Libro ({books.length})</h3>
            {books.length === 0 ? (
              <p style={{ color: '#888' }}>Wala pang nakatalang libro. Magdagdag sa itaas!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {books.map(book => (
                  <div key={book.id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `5px solid ${book.status === 'Completed' ? '#10b981' : book.status === 'Currently Reading' ? '#3b82f6' : '#6b7280'}` }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{book.title}</h4>
                      <p style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '0.9rem' }}>ni {book.author} • {book.pages || 0} pahina</p>
                      <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: '#2d2d2d', color: '#fff' }}>
                        {book.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        value={book.status} 
                        onChange={(e) => updateStatus(book.id, e.target.value)}
                        style={{ padding: '5px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        <option value="Want to Read">Want to Read</option>
                        <option value="Currently Reading">Reading</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button 
                        onClick={() => deleteBook(book.id)}
                        style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
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
  );
}