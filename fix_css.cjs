const fs = require('fs')
const p = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/Navbar.css'
let c = fs.readFileSync(p, 'utf8')

// Fix class name mismatch
c = c.replace('.vlt-nb-item-message {', '.vlt-nb-item-msg {')

// Replace the entire notification panel section with redesigned version
const oldPanel = c.slice(c.indexOf('.vlt-nb-panel {'), c.indexOf('/* ── user menu ──'))
const newPanel = `.vlt-nb-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: -8px;
  width: 360px;
  background: var(--vlt-bg-card);
  border: 1px solid var(--vlt-border-color);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
  animation: vlt-dropdown-in 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
}

.vlt-nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--vlt-border-color);
  background: rgba(255,255,255,0.02);
}
.vlt-nb-header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--vlt-text-primary);
  letter-spacing: 0.01em;
}
.vlt-nb-mark-all {
  background: none;
  border: 1px solid var(--vlt-border-color);
  border-radius: 6px;
  color: var(--vlt-text-muted);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
}
.vlt-nb-mark-all:hover {
  border-color: var(--vlt-text-accent);
  color: var(--vlt-text-accent);
  background: rgba(0,255,209,0.06);
}
.vlt-nb-mark-all:disabled { opacity: 0.4; cursor: default; }

.vlt-nb-content {
  max-height: 420px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--vlt-border-color) transparent;
}

.vlt-nb-list { padding: 6px 0; }

.vlt-nb-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 16px;
  cursor: default;
  transition: background 0.12s;
  position: relative;
}
.vlt-nb-item:hover { background: var(--vlt-bg-hover); }
.vlt-nb-item.unread {
  background: rgba(0, 255, 209, 0.04);
}
.vlt-nb-item.unread::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--vlt-text-accent);
  border-radius: 0 2px 2px 0;
}

.vlt-nb-item-ico {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.vlt-nb-item-body { flex: 1; min-width: 0; }

.vlt-nb-item-title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--vlt-text-primary);
  line-height: 1.35;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vlt-nb-item-msg {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 400;
  color: var(--vlt-text-secondary);
  line-height: 1.5;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vlt-nb-item-time {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 400;
  color: var(--vlt-text-muted);
  letter-spacing: 0.01em;
}

.vlt-nb-unread-dot {
  width: 6px;
  height: 6px;
  background: var(--vlt-text-accent);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 7px;
  box-shadow: 0 0 6px rgba(0,255,209,0.5);
}

.vlt-nb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--vlt-text-muted);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
}
.vlt-nb-empty-icon { opacity: 0.2; }

.vlt-nb-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 16px;
  color: var(--vlt-text-muted);
  font-family: var(--font-body);
  font-size: 13px;
}
.vlt-nb-spin {
  width: 14px; height: 14px;
  border: 2px solid var(--vlt-border-color);
  border-top-color: var(--vlt-text-accent);
  border-radius: 50%;
  animation: vlt-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes vlt-spin { to { transform: rotate(360deg); } }

`
c = c.replace(c.slice(c.indexOf('.vlt-nb-panel {'), c.indexOf('/* ── user menu ──')), newPanel)

fs.writeFileSync(p, c, 'utf8')
console.log('CSS fixed | msg class:', fs.readFileSync(p,'utf8').includes('.vlt-nb-item-msg {'))
