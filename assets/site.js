(() => {
  "use strict";

  const isFrench = document.documentElement.lang === "fr";
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const toast = document.querySelector("[data-toast]");
  let toastTimer;

  const copy = {
    downloadReady: (version) => isFrench ? `Télécharger Clippy ${version}` : `Download Clippy ${version}`,
    downloadStatus: (size) => isFrench
      ? `Sans signature Developer ID · ${size}`
      : `Not Developer ID signed · ${size}`,
    commandCopied: isFrench ? "Commande Homebrew copiée" : "Homebrew command copied",
    commandFailed: isFrench ? "Impossible de copier automatiquement" : "Could not copy automatically",
    brewReady: isFrench
      ? "Le Cask Homebrew est disponible."
      : "The Homebrew Cask is available.",
    notReady: isFrench
      ? "Le téléchargement direct sera activé dès la publication du DMG."
      : "Direct download will activate as soon as the DMG is published.",
  };

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  const closeMenu = () => {
    if (!menuButton || !navMenu) return;
    menuButton.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("is-open");
  };

  menuButton?.addEventListener("click", () => {
    const shouldOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(shouldOpen));
    navMenu?.classList.toggle("is-open", shouldOpen);
  });

  navMenu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) closeMenu();
  }, { passive: true });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const downloadButton = document.querySelector("[data-download-button]");
  const downloadLabel = document.querySelector("[data-download-label]");
  const downloadStatus = document.querySelector("[data-download-status]");

  downloadButton?.addEventListener("click", (event) => {
    if (downloadButton.getAttribute("aria-disabled") !== "true") return;
    event.preventDefault();
    showToast(copy.notReady);
  });

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "DMG";
    const megabytes = bytes / (1024 * 1024);
    return `${new Intl.NumberFormat(isFrench ? "fr-FR" : "en-US", {
      maximumFractionDigits: 1,
    }).format(megabytes)} MB`;
  };

  const checkLatestRelease = async () => {
    if (!downloadButton || !downloadLabel || !downloadStatus) return;

    try {
      const response = await fetch("https://api.github.com/repos/EvanPluchart/Clippy/releases?per_page=1", {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) return;

      const releases = await response.json();
      const release = Array.isArray(releases) ? releases[0] : null;
      if (!release) return;
      const dmg = Array.isArray(release.assets)
        ? release.assets.find((asset) => typeof asset.name === "string" && asset.name.toLowerCase().endsWith(".dmg"))
        : null;
      if (!dmg?.browser_download_url) return;

      const version = String(release.tag_name || "").replace(/^v/i, "") || "DMG";
      downloadButton.href = dmg.browser_download_url;
      downloadButton.removeAttribute("aria-disabled");
      downloadButton.classList.remove("is-disabled");
      downloadLabel.textContent = copy.downloadReady(version);
      downloadStatus.textContent = copy.downloadStatus(formatBytes(Number(dmg.size)));
      downloadStatus.classList.add("is-unsigned");
    } catch {
      // The static fallback remains accurate when GitHub is unavailable.
    }
  };

  const command = "brew install --cask EvanPluchart/tap/clippy";
  const copyButton = document.querySelector("[data-copy-command]");
  const copyIcon = document.querySelector("[data-copy-icon]");
  const brewStatus = document.querySelector("[data-brew-status]");

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      if (copyIcon) copyIcon.textContent = "✓";
      showToast(copy.commandCopied);
      window.setTimeout(() => {
        if (copyIcon) copyIcon.textContent = "□";
      }, 1800);
    } catch {
      showToast(copy.commandFailed);
    }
  };

  copyButton?.addEventListener("click", copyCommand);

  const checkHomebrewCask = async () => {
    if (!copyButton || !brewStatus) return;

    try {
      const response = await fetch("https://api.github.com/repos/EvanPluchart/homebrew-tap/git/trees/main?recursive=1", {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) return;

      const tree = await response.json();
      const caskExists = Array.isArray(tree.tree)
        && tree.tree.some((entry) => entry?.type === "blob" && entry.path === "Casks/clippy.rb");
      if (!caskExists) return;

      copyButton.disabled = false;
      brewStatus.textContent = copy.brewReady;
      brewStatus.classList.add("is-ready");
    } catch {
      // Keep the disabled state until the Cask is publicly reachable.
    }
  };

  void checkLatestRelease();
  void checkHomebrewCask();
})();
