const DEFAULT_SERVER_URL = "http://localhost:3001";

// === DOM Elements ===
const viewMenu = document.getElementById("view-menu");
const viewAdd = document.getElementById("view-add");
const viewSettings = document.getElementById("view-settings");

const btnAddBookmark = document.getElementById("btn-add-bookmark");
const btnEditBookmark = document.getElementById("btn-edit-bookmark");
const btnOpenApp = document.getElementById("btn-open-app");
const btnSettings = document.getElementById("btn-settings");
const btnBackAdd = document.getElementById("btn-back-add");
const btnBackSettings = document.getElementById("btn-back-settings");
const btnCancelAdd = document.getElementById("btn-cancel-add");
const btnCancelSettings = document.getElementById("btn-cancel-settings");
const btnFetchFavicon = document.getElementById("btn-fetch-favicon");
const btnRemoveFavicon = document.getElementById("btn-remove-favicon");
const btnSave = document.getElementById("btn-save");

const bookmarkForm = document.getElementById("bookmark-form");
const settingsForm = document.getElementById("settings-form");

const inputUrl = document.getElementById("input-url");
const inputName = document.getElementById("input-name");
const inputTags = document.getElementById("input-tags");
const selectFolder = document.getElementById("select-folder");
const inputServerUrl = document.getElementById("input-server-url");

const faviconPreview = document.getElementById("favicon-preview");
const formMessage = document.getElementById("form-message");
const settingsMessage = document.getElementById("settings-message");
const statusDot = document.querySelector(".status-dot");
const statusText = document.querySelector(".status-text");
const folderLoading = document.getElementById("folder-loading");

// === State ===
let serverUrl = DEFAULT_SERVER_URL;
let currentFavicon = "";
let nameEditedByUser = false;
let bookmarkTree = [];
let editingBookmark = null; // bookmark existente que se está editando

// === Init ===
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadSettings();
  checkServerStatus();
  setupEventListeners();
  checkExistingBookmark();
}

// === Settings ===
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["serverUrl"], (result) => {
      if (result.serverUrl) {
        serverUrl = result.serverUrl;
      }
      inputServerUrl.value = serverUrl;
      resolve();
    });
  });
}

async function saveSettings(url) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ serverUrl: url }, resolve);
  });
}

// === Server Status ===
async function checkServerStatus() {
  try {
    const response = await fetch(`${serverUrl}/api/health`);
    if (response.ok) {
      statusDot.className = "status-dot connected";
      statusText.textContent = "Conectado";
    } else {
      throw new Error("Not OK");
    }
  } catch {
    statusDot.className = "status-dot disconnected";
    statusText.textContent = "Sin conexión";
  }
}

// === Navigation ===
function showView(view) {
  viewMenu.classList.add("hidden");
  viewAdd.classList.add("hidden");
  viewSettings.classList.add("hidden");
  view.classList.remove("hidden");
}

function showMenu() {
  showView(viewMenu);
  hideMessage(formMessage);
  hideMessage(settingsMessage);
}

// === Event Listeners ===
function setupEventListeners() {
  btnAddBookmark.addEventListener("click", handleAddBookmark);
  btnEditBookmark.addEventListener("click", handleEditBookmark);
  btnOpenApp.addEventListener("click", handleOpenApp);
  btnSettings.addEventListener("click", handleOpenSettings);

  btnBackAdd.addEventListener("click", showMenu);
  btnBackSettings.addEventListener("click", showMenu);
  btnCancelAdd.addEventListener("click", showMenu);
  btnCancelSettings.addEventListener("click", showMenu);

  btnFetchFavicon.addEventListener("click", handleFetchFavicon);
  btnRemoveFavicon.addEventListener("click", handleRemoveFavicon);

  bookmarkForm.addEventListener("submit", handleSaveBookmark);
  settingsForm.addEventListener("submit", handleSaveSettings);

  inputUrl.addEventListener("input", handleUrlInput);
  inputName.addEventListener("input", () => {
    nameEditedByUser = true;
  });
}

// === Handlers ===
async function handleAddBookmark() {
  showView(viewAdd);
  nameEditedByUser = false;
  currentFavicon = "";
  faviconPreview.classList.add("hidden");
  btnRemoveFavicon.classList.add("hidden");
  hideMessage(formMessage);

  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      inputUrl.value = tab.url || "";
      // Auto-generate name from URL
      if (tab.title) {
        inputName.value = tab.title;
      } else {
        autoFillName(tab.url);
      }
      // Usar el favicon que Chrome ya tiene de la pestaña
      if (tab.favIconUrl) {
        currentFavicon = tab.favIconUrl;
        faviconPreview.src = tab.favIconUrl;
        faviconPreview.classList.remove("hidden");
        btnRemoveFavicon.classList.remove("hidden");
      }
    }
  } catch {
    // Can't access tab, leave fields empty
  }

  inputTags.value = "";
  loadFolders();
}

async function handleEditBookmark() {
  if (!editingBookmark) return;
  showView(viewAdd);
  nameEditedByUser = true;
  hideMessage(formMessage);

  inputUrl.value = editingBookmark.url || "";
  inputName.value = editingBookmark.name || "";
  inputTags.value = (editingBookmark.tags || []).join(", ");

  if (editingBookmark.icon) {
    currentFavicon = editingBookmark.icon;
    faviconPreview.src = editingBookmark.icon;
    faviconPreview.classList.remove("hidden");
    btnRemoveFavicon.classList.remove("hidden");
  } else {
    currentFavicon = "";
    faviconPreview.classList.add("hidden");
    btnRemoveFavicon.classList.add("hidden");
  }

  await loadFolders();

  // Seleccionar la carpeta donde está el bookmark
  const parentId = findParentId(bookmarkTree, editingBookmark.id);
  if (parentId) {
    selectFolder.value = parentId;
  }
}

function handleOpenApp() {
  chrome.tabs.create({ url: serverUrl });
  window.close();
}

function handleOpenSettings() {
  showView(viewSettings);
  inputServerUrl.value = serverUrl;
  hideMessage(settingsMessage);
}

function handleUrlInput() {
  if (!nameEditedByUser) {
    autoFillName(inputUrl.value);
  }
}

function autoFillName(url) {
  try {
    const hostname = new URL(url.trim()).hostname.replace(/^www\./, "");
    const withoutTld = hostname.replace(/\.[^.]+$/, "");
    inputName.value = withoutTld.charAt(0).toUpperCase() + withoutTld.slice(1);
  } catch {
    // URL incompleta
  }
}

async function handleFetchFavicon() {
  const url = inputUrl.value.trim();
  if (!url) return;

  btnFetchFavicon.disabled = true;
  btnFetchFavicon.innerHTML = '<span class="spinner"></span> Obteniendo...';

  try {
    const response = await fetch(
      `${serverUrl}/api/favicon?url=${encodeURIComponent(url)}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.icon) {
        currentFavicon = data.icon;
        faviconPreview.src = data.icon;
        faviconPreview.classList.remove("hidden");
        btnRemoveFavicon.classList.remove("hidden");
      }
    }
  } catch {
    // Favicon not available
  } finally {
    btnFetchFavicon.disabled = false;
    btnFetchFavicon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
      </svg>
      Obtener favicon`;
  }
}

function handleRemoveFavicon() {
  currentFavicon = "";
  faviconPreview.classList.add("hidden");
  btnRemoveFavicon.classList.add("hidden");
}

async function handleSaveBookmark(e) {
  e.preventDefault();

  const name = inputName.value.trim();
  if (!name) return;

  const url = inputUrl.value.trim();
  const tags = inputTags.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const folderId = selectFolder.value;

  const bookmark = {
    id: editingBookmark ? editingBookmark.id : Date.now().toString(),
    name,
    url: url || undefined,
    addDate:
      editingBookmark?.addDate || Math.floor(Date.now() / 1000).toString(),
    tags: tags.length > 0 ? tags : undefined,
    icon: currentFavicon || undefined,
  };

  btnSave.disabled = true;
  btnSave.innerHTML = '<span class="spinner"></span> Guardando...';

  try {
    let updatedTree;
    if (editingBookmark) {
      // Remove old bookmark from tree, then re-insert
      updatedTree = removeFromTree(bookmarkTree, editingBookmark.id);
      if (folderId === "root") {
        updatedTree = [...updatedTree, bookmark];
      } else {
        updatedTree = addToFolder(updatedTree, folderId, bookmark);
      }
    } else {
      if (folderId === "root") {
        updatedTree = [...bookmarkTree, bookmark];
      } else {
        updatedTree = addToFolder(bookmarkTree, folderId, bookmark);
      }
    }

    // Save to server
    const response = await fetch(`${serverUrl}/api/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTree),
    });

    if (!response.ok) throw new Error("Error al guardar");

    editingBookmark = null;
    showMessage(formMessage, "Bookmark guardado correctamente", "success");
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    showMessage(formMessage, "Error al guardar: " + err.message, "error");
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
      </svg>
      Guardar`;
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();

  const newUrl = inputServerUrl.value.trim().replace(/\/+$/, "");
  if (!newUrl) return;

  serverUrl = newUrl;
  await saveSettings(serverUrl);
  showMessage(settingsMessage, "Configuración guardada", "success");
  checkServerStatus();
  setTimeout(showMenu, 800);
}

// === Folder Operations ===
async function loadFolders() {
  folderLoading.classList.remove("hidden");
  selectFolder.innerHTML = '<option value="root">/ (raíz)</option>';

  try {
    const response = await fetch(`${serverUrl}/api/bookmarks`);
    if (!response.ok) throw new Error("Error");

    const result = await response.json();
    bookmarkTree = result.data || [];

    const folders = extractFolders(bookmarkTree);
    for (const folder of folders) {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.path;
      selectFolder.appendChild(option);
    }
  } catch {
    // Could not load folders, root will be used
  } finally {
    folderLoading.classList.add("hidden");
  }
}

function extractFolders(tree, parentPath = "") {
  const folders = [];
  for (const item of tree) {
    if (item.children) {
      const path = parentPath ? `${parentPath} / ${item.name}` : item.name;
      folders.push({ id: item.id, name: item.name, path });
      folders.push(...extractFolders(item.children, path));
    }
  }
  return folders;
}

function addToFolder(tree, folderId, bookmark) {
  return tree.map((item) => {
    if (item.id === folderId && item.children) {
      return { ...item, children: [...item.children, bookmark] };
    }
    if (item.children) {
      return {
        ...item,
        children: addToFolder(item.children, folderId, bookmark),
      };
    }
    return item;
  });
}

// === Search existing bookmark ===
async function checkExistingBookmark() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.url) return;

    const response = await fetch(`${serverUrl}/api/bookmarks`);
    if (!response.ok) return;

    const result = await response.json();
    bookmarkTree = result.data || [];

    const found = findBookmarkByUrl(bookmarkTree, tab.url);
    if (found) {
      editingBookmark = found;
      btnEditBookmark.classList.remove("hidden");
    }
  } catch {
    // Server not available
  }
}

function findBookmarkByUrl(tree, url) {
  for (const item of tree) {
    if (item.url === url) return item;
    if (item.children) {
      const found = findBookmarkByUrl(item.children, url);
      if (found) return found;
    }
  }
  return null;
}

function findParentId(tree, bookmarkId, parentId = "root") {
  for (const item of tree) {
    if (item.id === bookmarkId) return parentId;
    if (item.children) {
      const found = findParentId(item.children, bookmarkId, item.id);
      if (found) return found;
    }
  }
  return null;
}

function removeFromTree(tree, id) {
  return tree
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.children) {
        return { ...item, children: removeFromTree(item.children, id) };
      }
      return item;
    });
}

// === UI Helpers ===
function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.classList.remove("hidden");
}

function hideMessage(el) {
  el.classList.add("hidden");
  el.className = "form-message hidden";
}
