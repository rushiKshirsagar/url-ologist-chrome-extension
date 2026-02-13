chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  try {
    if (!tabs.length || !tabs[0].url) {
      document.getElementById('empty-state').classList.remove('hidden');
      return;
    }
    const url = new URL(tabs[0].url);
    const container = document.getElementById('buttons');
    const siteNameEl = document.getElementById('site-name');
    const emptyStateEl = document.getElementById('empty-state');

    siteNameEl.textContent = url.hostname.replace('www.', '');

    async function enterPiP() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          const video = document.querySelector('video');
          
          if (!video) {
            alert("No video found! Make sure the show is actually playing.");
            return;
          }
    
          video.removeAttribute('disablePictureInPicture');
          video.disablePictureInPicture = false;
    
          try {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await video.requestPictureInPicture();
            }
          } catch (err) {
            console.error("PiP failed: ", err);
            video.click(); 
            setTimeout(() => video.requestPictureInPicture(), 100);
          }
        }
      });
    }

    const tricks = {
      "youtube.com": [
        { label: "Official Endless Loop", description: "Plays this video on repeat forever", transform: (u) => { const v = new URL(u).searchParams.get("v"); return v ? `https://www.youtube.com/embed/${v}?autoplay=1&loop=1&playlist=${v}` : u; } },
        { label: "Floaty Video (PiP)", description: "Watch in a floating window on top of other apps", action: enterPiP },
        { label: "Cinema Mode", description: "Clean embed view without comments or sidebar", transform: (u) => u.replace("watch?v=", "embed/") + (u.includes("?") ? "&" : "?") + "rel=0" },
        { label: "Privacy embed", description: "Embed via youtube-nocookie.com (fewer cookies)", transform: (u) => { const v = new URL(u).searchParams.get("v"); return v ? `https://www.youtube-nocookie.com/embed/${v}` : u; } }
      ],
      "netflix.com": [
        { label: "Floaty Video (PiP)", description: "Watch in Picture-in-Picture", action: enterPiP },
        { label: "Secret: Crime Docs", description: "Browse crime documentaries (genre 9875)", transform: () => "https://www.netflix.com/browse/genre/9875" },
        { label: "Secret: Sci-Fi", description: "Browse science fiction (genre 1492)", transform: () => "https://www.netflix.com/browse/genre/1492" },
        { label: "Secret: Action", description: "Browse action & adventure (1365)", transform: () => "https://www.netflix.com/browse/genre/1365" },
        { label: "Secret: Anime", description: "Browse anime (7424)", transform: () => "https://www.netflix.com/browse/genre/7424" },
        { label: "Secret: Documentaries", description: "Browse documentaries (6839)", transform: () => "https://www.netflix.com/browse/genre/6839" }
      ],
      "google.com": [
        { label: "Past hour", description: "Results from the last hour", transform: (u) => u + (u.includes("?") ? "&" : "?") + "tbs=qdr:h" },
        { label: "Past 24 hours", description: "Results from the last day", transform: (u) => u + (u.includes("?") ? "&" : "?") + "tbs=qdr:d" },
        { label: "Past week", description: "Results from the last week", transform: (u) => u + (u.includes("?") ? "&" : "?") + "tbs=qdr:w" },
        { label: "Past month", description: "Results from the last month", transform: (u) => u + (u.includes("?") ? "&" : "?") + "tbs=qdr:m" },
        { label: "Verbatim", description: "Exact phrase, no synonyms or variations", transform: (u) => u + (u.includes("?") ? "&" : "?") + "tbs=li:1" },
        { label: "Unpersonalized", description: "Turn off personalized results (pws=0)", transform: (u) => u + (u.includes("?") ? "&" : "?") + "pws=0" }
      ],
      "github.com": [
        { label: "Open in VS Code Dev", description: "Edit in browser-based VS Code (github.dev)", transform: (u) => u.replace("github.com", "github.dev") },
        { label: "View Commits", description: "See commit history for this repo", transform: (u) => (u.split("?")[0].replace(/\/$/, "") + "/commits") },
        { label: "GitHub1s (VS Code)", description: "Alternative VS Code-style viewer", transform: (u) => u.replace("github.com", "github1s.com") }
      ],
      "wikipedia.org": [
        { label: "Simple English", description: "Same article in simplified English", transform: (u) => u.replace("en.wikipedia", "simple.wikipedia") },
        { label: "Mobile Wikipedia", description: "Lightweight mobile layout", transform: (u) => u.replace("en.wikipedia.org", "en.m.wikipedia.org") }
      ],
      "amazon.com": [
        { label: "Min 50% off", description: "Filter by at least 50% discount", transform: (u) => u + (u.includes("?") ? "&" : "?") + "pct-off=50-" },
        { label: "Min 70% off", description: "Filter by at least 70% discount", transform: (u) => u + (u.includes("?") ? "&" : "?") + "pct-off=70-" }
      ],
      "reddit.com": [
        { label: "Old Reddit", description: "Use classic Reddit layout", transform: (u) => u.replace("www.reddit", "old.reddit") },
        { label: "Compact view", description: "Lightweight compact layout", transform: (u) => u.split("?")[0].replace(/\/$/, "") + ".compact" },
        { label: "Raw JSON", description: "Get page data as JSON", transform: (u) => u.split("?")[0].replace(/\/$/, "") + ".json" }
      ],
      "docs.google.com": [
        { label: "Copy document", description: "Open 'Make a copy' link", transform: (u) => u.split("?")[0].replace("/edit", "/copy") },
        { label: "Export as PDF", description: "Direct download as PDF", transform: (u) => u.split("?")[0].replace("/edit", "/export") + "?format=pdf" },
        { label: "Export as Word", description: "Download as .docx", transform: (u) => u.split("?")[0].replace("/edit", "/export") + "?format=docx" }
      ],
      "quora.com": [
        { label: "View without login", description: "Read answers without signing in (share=1)", transform: (u) => u + (u.includes("?") ? "&" : "?") + "share=1" }
      ],
      "facebook.com": [
        { label: "Chronological feed", description: "Newest posts first, less algorithm", transform: () => "https://www.facebook.com/?sk=h_chr" }
      ],
      "dropbox.com": [
        { label: "Direct download", description: "Force download instead of preview (dl=1)", transform: (u) => u.includes("dl=0") ? u.replace("dl=0", "dl=1") : u + (u.includes("?") ? "&" : "?") + "dl=1" }
      ],
      "imgur.com": [
        { label: "Small thumb", description: "Small thumbnail (90px)", transform: (u) => u.replace(/(\.[a-z]+)$/i, "s$1") },
        { label: "Medium thumb", description: "Medium thumbnail (320px)", transform: (u) => u.replace(/(\.[a-z]+)$/i, "m$1") },
        { label: "Large thumb", description: "Large thumbnail (640px)", transform: (u) => u.replace(/(\.[a-z]+)$/i, "l$1") }
      ],
      "archive.org": [
        { label: "Save Page Now", description: "Archive this page in Wayback Machine", transform: (u) => "https://web.archive.org/save/" + u },
        { label: "Stream book text", description: "Read book as text (for /details/ pages)", transform: (u) => u.replace("/details/", "/stream/") }
      ],
      "steampowered.com": [
        { label: "Open in Steam", description: "Open this page in Steam client", transform: (u) => "steam://openurl/" + u }
      ],
      "ebay.com": [
        { label: "200 per page", description: "Show up to 200 items per page", transform: (u) => u + (u.includes("?") ? "&" : "?") + "_ipg=200" }
      ],
      "zoom.us": [
        { label: "Join in browser", description: "Join meeting in browser (no app)", transform: (u) => u.replace("/j/", "/wc/join/") }
      ],
      "canva.com": [
        { label: "View only", description: "Open design in view-only mode", transform: (u) => u.replace("/edit", "/view") }
      ],
      "craigslist.org": [
        { label: "Sort: price low", description: "Sort listings by price ascending", transform: (u) => u + (u.includes("?") ? "&" : "?") + "sort=priceasc" }
      ],
      "spotify.com": [
        { label: "Open in app", description: "Open in Spotify desktop app", transform: (u) => u.replace("https://open.spotify.com/", "spotify:") }
      ],
      "nytimes.com": [
        { label: "Search archive", description: "Search NYT archive", transform: (u) => "https://www.nytimes.com/search?query=" }
      ],
      "linkedin.com": [
        { label: "Jobs (active)", description: "View active job listings", transform: (u) => u + (u.includes("?") ? "&" : "?") + "activeJobId=current" }
      ],
      "soundcloud.com": [
        { label: "Classic player", description: "Use classic player layout (visual=false)", transform: (u) => u + (u.includes("?") ? "&" : "?") + "visual=false" }
      ],
      "ted.com": [
        { label: "Spanish subtitles", description: "Prefer Spanish language", transform: (u) => u + (u.includes("?") ? "&" : "?") + "language=es" }
      ],
      "discord.com": [
        { label: "Open in app", description: "Open in Discord desktop app", transform: () => "discord://" }
      ],
      "pinterest.com": [
        { label: "AMP version", description: "Faster-loading AMP page", transform: (u) => u + (u.includes("?") ? "&" : "?") + "amp=1" }
      ]
    };

    const domainMatch = Object.keys(tricks).find(d => url.hostname.includes(d));

    if (domainMatch) {
      emptyStateEl.classList.add('hidden');
      container.innerHTML = '';
      
      tricks[domainMatch].forEach((trick, index) => {
        const btn = document.createElement('button');
        btn.style.animationDelay = `${index * 0.05}s`;
        
        const label = document.createElement('span');
        label.className = 'button-label';
        label.textContent = trick.label;
        
        const description = document.createElement('span');
        description.className = 'button-description';
        description.textContent = trick.description || '';
        
        btn.appendChild(label);
        if (trick.description) btn.appendChild(description);
        
        btn.onclick = () => {
          if (trick.action) {
            trick.action();
          } else if (trick.transform) {
            chrome.tabs.create({ url: trick.transform(tabs[0].url) });
          }
        };
        
        container.appendChild(btn);
      });
    } else {
      emptyStateEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error(error);
    document.getElementById('empty-state').classList.remove('hidden');
  }
});