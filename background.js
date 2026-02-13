const TRICK_DOMAINS = [
  "youtube.com",
  "netflix.com",
  "google.com",
  "github.com",
  "wikipedia.org",
  "amazon.com",
  "reddit.com",
  "docs.google.com",
  "quora.com",
  "facebook.com",
  "dropbox.com",
  "imgur.com",
  "archive.org",
  "steampowered.com",
  "ebay.com",
  "zoom.us",
  "canva.com",
  "craigslist.org",
  "spotify.com",
  "nytimes.com",
  "linkedin.com",
  "soundcloud.com",
  "ted.com",
  "discord.com",
  "pinterest.com",
];

function updateIconForUrl(tabId, urlString) {
  if (!urlString || !urlString.startsWith("http")) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  let hasTricks = false;
  try {
    const url = new URL(urlString);
    hasTricks = TRICK_DOMAINS.some((domain) => url.hostname.includes(domain));
  } catch (e) {
    hasTricks = false;
  }

  if (hasTricks) {
    chrome.action.setBadgeText({ tabId, text: "●" });
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#f97316" });
  } else {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateIconForUrl(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      updateIconForUrl(tab.id, tab.url);
    }
  } catch (e) {
    // ignore
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id !== undefined && tab.url) {
        updateIconForUrl(tab.id, tab.url);
      }
    });
  });
});

