import { useState } from "react";

const CATEGORIES = {
  Reactions: [
    { label: "😂 LOL",       url: "https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif" },
    { label: "👍 Nice",      url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
    { label: "👏 Clap",      url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" },
    { label: "🤯 Mindblown", url: "https://media.giphy.com/media/26ufdipQqU84NThq0/giphy.gif" },
    { label: "😍 Love",      url: "https://media.giphy.com/media/l0MYJMT3MuqpApSfe/giphy.gif" },
    { label: "🔥 Fire",      url: "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif" },
    { label: "🤦 Facepalm",  url: "https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif" },
    { label: "😮 Wow",       url: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif" },
    { label: "😴 Boring",    url: "https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif" },
    { label: "🤣 LMAO",      url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
    { label: "😎 Cool",      url: "https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif" },
    { label: "🎉 Party",     url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" },
  ],
  Greetings: [
    { label: "👋 Hello",     url: "https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif" },
    { label: "👋 Bye",       url: "https://media.giphy.com/media/42D3CxaINsAFemFuId/giphy.gif" },
    { label: "✅ Yes",       url: "https://media.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif" },
    { label: "❌ No",        url: "https://media.giphy.com/media/d10dMmzqCYqQ0/giphy.gif" },
    { label: "🙏 Thanks",    url: "https://media.giphy.com/media/6tHy8UAbv3zgs/giphy.gif" },
    { label: "😬 Sorry",     url: "https://media.giphy.com/media/Vg6vGMxVs9Xe8/giphy.gif" },
    { label: "🤝 Deal",      url: "https://media.giphy.com/media/3oEdva9BUHPHz2olf2/giphy.gif" },
    { label: "🌅 GM",        url: "https://media.giphy.com/media/3oEdv8FfHDTjNLMJNu/giphy.gif" },
  ],
  Fun: [
    { label: "💃 Dance",     url: "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif" },
    { label: "🐶 Dog",       url: "https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif" },
    { label: "🐱 Cat",       url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
    { label: "🏆 Win",       url: "https://media.giphy.com/media/3oz8xRF0v9WMAUVLNK/giphy.gif" },
    { label: "🤖 Robot",     url: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif" },
    { label: "🙈 Hide",      url: "https://media.giphy.com/media/l41YkFIiBxQdRlMnC/giphy.gif" },
    { label: "🌈 Magic",     url: "https://media.giphy.com/media/3oEdvaABscWDHlCpsk/giphy.gif" },
    { label: "😤 Nope",      url: "https://media.giphy.com/media/3o6ZsSVy0NKXZ1vDSo/giphy.gif" },
  ],
};

export default function GifPanel({ onSelect }) {
  const tabs = Object.keys(CATEGORIES);
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="gif-panel">
      <div className="gif-tabs">
        {tabs.map(tab => (
          <button key={tab} className={`gif-tab ${active === tab ? "active" : ""}`} onClick={() => setActive(tab)}>{tab}</button>
        ))}
      </div>
      <div className="gif-grid">
        {CATEGORIES[active].map(item => (
          <button key={item.url} className="gif-item" onClick={() => onSelect(item.url)} title={item.label}>
            <img src={item.url} alt={item.label} loading="lazy"
              onError={e => { e.currentTarget.parentElement.style.display = "none"; }}/>
            <span className="gif-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
