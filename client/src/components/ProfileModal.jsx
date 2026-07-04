import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Camera, User, FileText } from 'lucide-react';

function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    const success = await updateProfile(formData);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} className="fade-in">
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Profile</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper} onClick={() => fileInputRef.current.click()}>
              {preview ? (
                <img src={preview} alt="Avatar Preview" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.cameraOverlay}>
                <Camera size={20} color="#fff" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageChange}
            />
            <p style={styles.avatarHelp}>Click photo to upload new image</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputContainer}>
              <User size={18} style={styles.icon} />
              <input
                type="text"
                required
                className="glass-input"
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Bio</label>
            <div style={styles.inputContainer}>
              <FileText size={18} style={styles.icon} />
              <textarea
                className="glass-input"
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Write something about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    padding: '28px',
    margin: '20px',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    transition: 'color 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  avatarWrapper: {
    position: 'relative',
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    cursor: 'pointer',
    overflow: 'hidden',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    fontSize: '2.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  avatarHelp: {
    fontSize: '0.75rem',
    color: '#71717a',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#e4e4e7',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '14px',
    color: '#71717a',
  },
  input: {
    width: '100%',
    paddingLeft: '42px',
  },
  textarea: {
    resize: 'none',
    paddingTop: '10px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--border-glass)',
    color: '#e4e4e7',
    borderRadius: '10px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
};

export default ProfileModal;
