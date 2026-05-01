import { useState, useEffect, useRef } from "react";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import GifPanel from "./GifPanel";
import { playJoin, playLeave, playMessage, playSent } from "./sounds";
import { ChatHero, EmptyChat, ConnectingSpinner } from "./Animations";
import "./App.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";
const WS_BASE = BACKEND.replace(/^http/, "ws") + "/ws";
const UPLOAD_URL = import.meta.env.VITE_BACKEND_URL ? BACKEND + "/upload" : "/upload";

const PALETTE = [
  "#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706",
  "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#9333ea",
];

function userColor(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  let res;
  try {
    res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  } catch (networkErr) {
    throw new Error("Network error uploading file: " + networkErr.message);
  }
  if (!res.ok) {
    let errText = "";
    try { errText = await res.text(); } catch (_) {}
    throw new Error(`Upload failed (${res.status}): ${errText || res.statusText}`);
  }
  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    throw new Error("Invalid upload response (not JSON): " + parseErr.message);
  }
  if (!data.url) throw new Error("Upload response missing 'url' field");
  return data.url;
}

export default function App() {
  const [screen, setScreen] = useState("join");
  const [username, setUsername] = useState("");
  const [joinError, setJoinError] = useState("");
  const [messages, setMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState({});
  const [unreadDMs, setUnreadDMs] = useState({});
  const [users, setUsers] = useState([]);
  const [knownUsers, setKnownUsers] = useState([]);
  const [view, setView] = useState("group");
  const [dmPartner, setDmPartner] = useState(null);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const aiBufferRef = useRef("");
  const myName = useRef("");
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunks = useRef([]);
  const recTimerRef = useRef(null);
  const viewRef = useRef("group");
  const dmPartnerRef = useRef(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    dmPartnerRef.current = dmPartner;
  }, [dmPartner]);

  useEffect(() => {
    setKnownUsers((prev) => {
      const names = new Set(prev.map((u) => u.name));
      const next = [...prev];
      users.forEach((u) => {
        if (!names.has(u.name) && u.name !== myName.current) {
          next.push(u);
          names.add(u.name);
        }
      });
      return next.map((u) => {
        const live = users.find((lu) => lu.name === u.name);
        return { ...u, online: !!live };
      });
    });
  }, [users]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dmMessages, view, dmPartner]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmoji(false);
        setShowGif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function wsSend(payload) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  function join() {
    const name = username.trim();
    if (!name) { setJoinError("Please enter a username."); return; }
    if (name.length < 2) { setJoinError("Username must be at least 2 characters."); return; }
    setJoinError("");
    myName.current = name;

    const ws = new WebSocket(`${WS_BASE}/${encodeURIComponent(name)}`);
    wsRef.current = ws;

    ws.onerror = () => {
      setJoinError("Could not connect to server. Please try again.");
    };

    ws.onopen = () => {
      setConnected(true);
      setScreen("chat");
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === "system") {
        setMessages((prev) => [...prev, { type: "system", text: data.text, id: Date.now() + Math.random() }]);
        if (data.text && data.text.includes("joined")) playJoin();
        if (data.text && data.text.includes("left")) playLeave();
        if (data.users) setUsers(data.users);
      } else if (data.type === "message") {
        const isMine = data.from === myName.current;
        setMessages((prev) => [
          ...prev,
          {
            type: "message",
            from: data.from,
            text: data.text,
            mediaUrl: data.mediaUrl || null,
            mediaType: data.mediaType || null,
            id: Date.now() + Math.random(),
            isMine,
          },
        ]);
        if (!isMine) playMessage();
      } else if (data.type === "ai_start") {
        aiBufferRef.current = "";
        setAiStreaming(true);
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: "", id: "ai-streaming", streaming: true },
        ]);
      } else if (data.type === "ai_chunk") {
        aiBufferRef.current += data.chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === "ai-streaming" ? { ...m, text: aiBufferRef.current } : m
          )
        );
      } else if (data.type === "ai_done") {
        setAiStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === "ai-streaming"
              ? { ...m, text: aiBufferRef.current, streaming: false, id: Date.now() + Math.random() }
              : m
          )
        );
        aiBufferRef.current = "";
      } else if (data.type === "dm") {
        const partner = data.from === myName.current ? data.to : data.from;
        const isMine = data.from === myName.current;
        const msg = {
          type: "message",
          from: data.from,
          text: data.text,
          mediaUrl: data.mediaUrl || null,
          mediaType: data.mediaType || null,
          id: Date.now() + Math.random(),
          isMine,
        };
        setDmMessages((prev) => ({
          ...prev,
          [partner]: [...(prev[partner] || []), msg],
        }));
        if (!isMine) {
          playMessage();
          const currentView = viewRef.current;
          const currentPartner = dmPartnerRef.current;
          if (!(currentView === "dm" && currentPartner === partner)) {
            setUnreadDMs((prev) => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
          }
        }
      }
    };
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    if (view === "dm" && dmPartner) {
      wsSend({ type: "dm", to: dmPartner, text });
    } else {
      wsSend({ type: "message", text });
    }
    setInput("");
    setShowEmoji(false);
    setShowGif(false);
    playSent();
  }

  function askAI() {
    const text = input.trim();
    if (!text || view !== "group") return;
    wsSend({ type: "ask_ai", text });
    setInput("");
    setShowEmoji(false);
  }

  async function handleImageFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      if (view === "dm" && dmPartner) {
        wsRef.current.send(JSON.stringify({ type: "dm", to: dmPartner, text: "", mediaUrl: url, mediaType }));
      } else {
        wsRef.current.send(JSON.stringify({ type: "message", text: "", mediaUrl: url, mediaType }));
      }
      playSent();
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      audioChunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        setUploading(true);
        try {
          const url = await uploadFile(file);
          if (view === "dm" && dmPartner) {
            wsRef.current.send(JSON.stringify({ type: "dm", to: dmPartner, text: "", mediaUrl: url, mediaType: "audio" }));
          } else {
            wsRef.current.send(JSON.stringify({ type: "message", text: "", mediaUrl: url, mediaType: "audio" }));
          }
          playSent();
        } catch (err) {
          alert("Voice upload error: " + err.message);
        } finally {
          setUploading(false);
        }
      };
      rec.start();
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone access denied.");
    }
  }

  function stopRecording() {
    if (!recording) return;
    clearInterval(recTimerRef.current);
    mediaRecRef.current?.stop();
    setRecording(false);
    setRecSeconds(0);
  }

  function openDM(user) {
    setDmPartner(user.name);
    setView("dm");
    setUnreadDMs((prev) => { const n = { ...prev }; delete n[user.name]; return n; });
    setShowEmoji(false);
    setShowGif(false);
  }

  function openGroup() {
    setView("group");
    setDmPartner(null);
    setShowEmoji(false);
    setShowGif(false);
  }

  function renderMessage(msg, i) {
    if (msg.type === "system") {
      return (
        <div key={msg.id || i} className="system-msg">{msg.text}</div>
      );
    }
    if (msg.type === "ai") {
      return (
        <div key={msg.id || i} className={`ai-bubble${msg.streaming && !msg.text ? " typing" : ""}`}>
          <span className="ai-label">AI</span>
          {msg.streaming && !msg.text ? (
            <span className="typing-dots">
              <span className="anim-dot1" />
              <span className="anim-dot2" />
              <span className="anim-dot3" />
            </span>
          ) : (
            <span>{msg.text}</span>
          )}
        </div>
      );
    }
    const isMe = msg.isMine;
    const color = userColor(msg.from);

    if (msg.mediaType === "gif" || (msg.mediaUrl && (msg.mediaType === "image" || msg.mediaType === "video"))) {
      return (
        <div key={msg.id || i} className={`msg-row ${isMe ? "self-row" : "other-row"}`}>
          {!isMe && (
            <div className="avatar" style={{ background: color }}>{initials(msg.from)}</div>
          )}
          <div className={`bubble-col ${isMe ? "self-col" : "other-col"}`}>
            {!isMe && <div className="msg-name" style={{ color }}>{msg.from}</div>}
            <div className="media-wrapper">
              {msg.mediaType === "video" ? (
                <video className="chat-media" src={msg.mediaUrl} controls />
              ) : (
                <img className="chat-media" src={msg.mediaUrl} alt="media" loading="lazy" />
              )}
            </div>
            {msg.text ? <div className={isMe ? "self-bubble" : "other-bubble"}>{msg.text}</div> : null}
          </div>
          {isMe && (
            <div className="avatar self-avatar" style={{ background: color }}>{initials(msg.from)}</div>
          )}
        </div>
      );
    }

    if (msg.mediaType === "audio") {
      return (
        <div key={msg.id || i} className={`msg-row ${isMe ? "self-row" : "other-row"}`}>
          {!isMe && (
            <div className="avatar" style={{ background: color }}>{initials(msg.from)}</div>
          )}
          <div className={`bubble-col ${isMe ? "self-col" : "other-col"}`}>
            {!isMe && <div className="msg-name" style={{ color }}>{msg.from}</div>}
            <div className={`audio-wrapper${isMe ? " self-audio" : ""}`}>
              <audio className="chat-audio" src={msg.mediaUrl} controls />
            </div>
          </div>
          {isMe && (
            <div className="avatar self-avatar" style={{ background: color }}>{initials(msg.from)}</div>
          )}
        </div>
      );
    }

    return (
      <div key={msg.id || i} className={`msg-row ${isMe ? "self-row" : "other-row"}`}>
        {!isMe && (
          <div className="avatar" style={{ background: color }}>{initials(msg.from)}</div>
        )}
        <div className={`bubble-col ${isMe ? "self-col" : "other-col"}`}>
          {!isMe && <div className="msg-name" style={{ color }}>{msg.from}</div>}
          <div className={isMe ? "self-bubble" : "other-bubble"}>{msg.text}</div>
        </div>
        {isMe && (
          <div className="avatar self-avatar" style={{ background: color }}>{initials(msg.from)}</div>
        )}
      </div>
    );
  }

  if (screen === "join") {
    return (
      <div className="join-screen">
        <div className="join-card">
          <ChatHero />
          <h1>Welcome to ChatBot</h1>
          <p className="join-subtitle">Connect, chat, and collaborate in real time.</p>
          <input
            className="join-input"
            placeholder="Enter your username"
            value={username}
            maxLength={24}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            autoFocus
          />
          {joinError && <div className="join-error">{joinError}</div>}
          <button className="join-btn" onClick={join}>
            Join Chat
          </button>
          <p className="join-hint">
            Tip: use <code>/gif cats</code> to share a GIF in chat!
          </p>
        </div>
      </div>
    );
  }

  const currentMessages = view === "dm" && dmPartner ? (dmMessages[dmPartner] || []) : messages;
  const dmPartnerUser = knownUsers.find((u) => u.name === dmPartner);
  const dmPartnerOnline = dmPartnerUser?.online ?? false;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="users-sidebar">
        <button
          className={`sidebar-group-btn${view === "group" ? " sidebar-group-active" : ""}`}
          onClick={openGroup}
        >
          <span className="sidebar-hash">#</span>
          <span>General</span>
        </button>

        <div className="sidebar-section-label">DIRECT MESSAGES</div>

        <ul className="users-list">
          {knownUsers.map((u) => {
            const unread = unreadDMs[u.name] || 0;
            const isActive = view === "dm" && dmPartner === u.name;
            return (
              <li
                key={u.name}
                className={`user-item${isActive ? " dm-active" : ""}${!u.online ? " offline-user" : ""}`}
                onClick={() => openDM(u)}
              >
                <div className="dm-avatar-wrap">
                  <div className="dm-avatar" style={{ background: userColor(u.name) }}>
                    {initials(u.name)}
                  </div>
                  <span className={`presence-dot ${u.online ? "presence-online" : "presence-offline"}`} />
                </div>
                <span className="user-item-name">{u.name}</span>
                {!u.online && <span className="offline-tag">offline</span>}
                {unread > 0 && <span className="unread-badge">{unread}</span>}
              </li>
            );
          })}
          {knownUsers.length === 0 && (
            <li className="user-item no-users">No other users yet</li>
          )}
        </ul>
      </aside>

      {/* Main chat */}
      <div
        className="chat-main"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Header */}
        <div className="chat-header">
          {view === "dm" && dmPartner ? (
            <>
              <button className="back-btn" onClick={openGroup}>&#8592;</button>
              <div className="dm-header-avatar" style={{ background: userColor(dmPartner) }}>
                {initials(dmPartner)}
              </div>
              <div className="header-info">
                <div className="header-dm-name">
                  {dmPartner}
                  {dmPartner === myName.current && <span className="header-you">(you)</span>}
                </div>
                <div className={`status-text ${dmPartnerOnline ? "online" : "offline"}`}>
                  {dmPartnerOnline ? "Online" : "Offline"}
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="header-icon">#</span>
              <div className="header-info">
                <h1>General</h1>
                <div className="header-sub">
                  {connected ? (
                    <span className="status-text online">{users.length} online</span>
                  ) : (
                    <span className="status-text offline">Disconnected</span>
                  )}
                </div>
              </div>
            </>
          )}
          {!connected && <ConnectingSpinner />}
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {currentMessages.length === 0 && (
            <EmptyChat isDM={view === "dm"} partner={dmPartner} />
          )}
          {dragging && (
            <div className="drop-overlay">
              <div className="drop-label">Drop image here</div>
            </div>
          )}
          {currentMessages.map((msg, i) => renderMessage(msg, i))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input" ref={pickerRef}>
          {(showEmoji || showGif) && (
            <div className="picker-popup">
              {showEmoji && (
                <EmojiPicker
                  theme={EmojiTheme.LIGHT}
                  onEmojiClick={(emojiData) => {
                    setInput((prev) => prev + emojiData.emoji);
                    setShowEmoji(false);
                  }}
                  height={340}
                  width={300}
                />
              )}
              {showGif && (
                <GifPanel
                  onSelect={(gifUrl) => {
                    if (view === "dm" && dmPartner) {
                      wsRef.current.send(JSON.stringify({ type: "dm", to: dmPartner, text: "", mediaUrl: gifUrl, mediaType: "gif" }));
                    } else {
                      wsRef.current.send(JSON.stringify({ type: "message", text: "", mediaUrl: gifUrl, mediaType: "gif" }));
                    }
                    setShowGif(false);
                    playSent();
                  }}
                />
              )}
            </div>
          )}

          <div className="input-row">
            <button
              className="icon-btn emoji-btn"
              title="Emoji"
              onClick={() => { setShowEmoji((v) => !v); setShowGif(false); }}
            >
              😊
            </button>
            <button
              className="icon-btn gif-btn"
              title="GIF"
              onClick={() => { setShowGif((v) => !v); setShowEmoji(false); }}
            >
              GIF
            </button>
            <button
              className="icon-btn img-btn"
              title="Upload image"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <span className="spinner" /> : "🖼"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={onFileChange}
            />

            <textarea
              className="chat-textarea"
              rows={1}
              placeholder={view === "dm" ? `Message ${dmPartner}…` : "Message #general…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            {view === "group" && (
              <button
                className="icon-btn ask-btn"
                title="Ask AI"
                onClick={askAI}
                disabled={aiStreaming || !input.trim()}
              >
                AI
              </button>
            )}

            <button
              className={`icon-btn mic-btn${recording ? " recording" : ""}`}
              title={recording ? "Stop recording" : "Hold to record"}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              {recording ? (
                <span className="rec-indicator">
                  <span className="rec-dot" />
                  <span className="rec-time">{recSeconds}s</span>
                </span>
              ) : (
                "🎤"
              )}
            </button>

            <button
              className="send-btn"
              onClick={send}
              disabled={!input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
