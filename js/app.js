/**
 * Tell Pal – Hauptanwendungslogik (mit i18n)
 */
const App = (() => {
    let navigationStack = [];
    let editMode = false;
    let currentEditItem = null;
    let isCreatingNew = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let customizationsCache = {};
    let customItemsMap = {}; // parentId -> [items] for user-created symbols

    const grid = document.getElementById('grid-container');
    const btnSettings = document.getElementById('btn-settings');
    const pageTitle = document.getElementById('page-title');
    const settingsModal = document.getElementById('settings-modal');
    const editModal = document.getElementById('edit-modal');
    const synth = window.speechSynthesis;

    // ==================== Init ====================
    async function init() {
        await StorageManager.open();
        await loadCustomizations();
        await loadCustomItems();
        renderLevel(APP_DATA.categories, I18N.t('appTitle'));
        bindGlobalEvents();
    }

    async function loadCustomizations() {
        const all = await StorageManager.getAllCustomizations();
        customizationsCache = {};
        for (const item of all) customizationsCache[item.id] = item;
    }

    async function loadCustomItems() {
        const stored = localStorage.getItem('tellpal-custom-items');
        customItemsMap = stored ? JSON.parse(stored) : {};
    }

    function saveCustomItems() {
        localStorage.setItem('tellpal-custom-items', JSON.stringify(customItemsMap));
    }

    // ==================== i18n helpers ====================
    function itemLabel(item) {
        const c = customizationsCache[item.id];
        if (c && c.label) return c.label;
        return getItemText(item).label;
    }
    function itemSpeech(item) {
        const c = customizationsCache[item.id];
        if (c && c.speech) return c.speech;
        return getItemText(item).speech;
    }

    // ==================== Rendering ====================
    function getItemsWithCustom(items) {
        // Find the parent id to look up custom items
        const parentId = findParentId(items);
        const customItems = parentId && customItemsMap[parentId] ? customItemsMap[parentId] : [];
        return [...items, ...customItems];
    }

    function findParentId(items) {
        // If these are the root categories, parent is 'root'
        if (items === APP_DATA.categories) return 'root';
        function search(parent, parentId) {
            for (const item of parent) {
                if (item.items === items) return item.id;
                if (item.items) {
                    const found = search(item.items, item.id);
                    if (found) return found;
                }
            }
            return null;
        }
        // Also search in custom items
        const fromData = search(APP_DATA.categories, 'root');
        if (fromData) return fromData;
        // Check custom items too
        for (const [pid, citems] of Object.entries(customItemsMap)) {
            for (const ci of citems) {
                if (ci.items === items) return ci.id;
            }
        }
        return 'root';
    }

    let currentParentId = 'root';

    function renderLevel(items, title) {
        grid.innerHTML = '';
        pageTitle.textContent = title;
        currentParentId = findParentId(items);
        const allItems = getItemsWithCustom(items);
        let offset = 0;
        // Insert back card as first element when not at root
        if (navigationStack.length > 0) {
            const backCard = createBackCard();
            backCard.style.animationDelay = '0s';
            grid.appendChild(backCard);
            offset = 1;
        }
        allItems.forEach((item, i) => {
            const card = createCard(item);
            card.style.animationDelay = `${(i + offset) * 0.02}s`;
            grid.appendChild(card);
        });
        // Add "new symbol" card in edit mode
        if (editMode) {
            const addCard = createAddCard();
            addCard.style.animationDelay = `${(allItems.length + offset) * 0.02}s`;
            grid.appendChild(addCard);
        }
        grid.scrollTop = 0;
    }

    function createBackCard() {
        const card = document.createElement('div');
        card.className = 'card back-card';
        const arrow = document.createElement('div');
        arrow.className = 'card-emoji';
        arrow.textContent = '⬅️';
        card.appendChild(arrow);
        const label = document.createElement('div');
        label.className = 'card-label';
        label.textContent = I18N.getLang() === 'de' ? 'Zurück' :
            I18N.getLang() === 'en' ? 'Back' :
            I18N.getLang() === 'tr' ? 'Geri' :
            I18N.getLang() === 'uk' ? 'Назад' :
            I18N.getLang() === 'ru' ? 'Назад' : 'Zurück';
        card.appendChild(label);
        card.addEventListener('click', goBack);
        return card;
    }

    function createAddCard() {
        const card = document.createElement('div');
        card.className = 'card add-card';
        const emoji = document.createElement('div');
        emoji.className = 'card-emoji';
        emoji.textContent = '➕';
        card.appendChild(emoji);
        const label = document.createElement('div');
        label.className = 'card-label';
        label.textContent = I18N.t('newSymbol');
        card.appendChild(label);
        card.addEventListener('click', openCreateModal);
        return card;
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = item.id;
        if (item.color) card.dataset.color = item.color;
        if (item.isHelp) card.classList.add('help-card');

        const custom = customizationsCache[item.id];

        if (custom && custom.image) {
            const img = document.createElement('img');
            img.className = 'card-image';
            img.src = custom.image;
            img.alt = itemLabel(item);
            card.appendChild(img);
        } else {
            const emojiDiv = document.createElement('div');
            emojiDiv.className = 'card-emoji';
            emojiDiv.textContent = item.emoji;
            card.appendChild(emojiDiv);
        }

        const label = document.createElement('div');
        label.className = 'card-label';
        label.textContent = itemLabel(item);
        card.appendChild(label);

        const editBtn = document.createElement('button');
        editBtn.className = 'card-edit-btn';
        editBtn.textContent = '✏️';
        editBtn.setAttribute('aria-label', I18N.t('editTitle'));
        editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(item); });
        card.appendChild(editBtn);

        card.addEventListener('click', () => handleCardTap(item, card));
        return card;
    }

    // ==================== Navigation & Speech ====================
    function handleCardTap(item, cardElement) {
        // In edit mode: only allow navigation to sub-levels, no speech
        if (editMode) {
            if (item.items && item.items.length > 0) {
                const currentItems = navigationStack.length === 0 ? APP_DATA.categories : null;
                navigationStack.push({ items: currentItems || getCurrentDisplayedItems(), title: pageTitle.textContent });
                renderLevel(item.items, itemLabel(item));
            }
            return;
        }

        cardElement.classList.add('speaking');
        setTimeout(() => cardElement.classList.remove('speaking'), 600);

        const custom = customizationsCache[item.id];
        if (custom && custom.sound) {
            playCustomSound(custom.sound);
        } else {
            speak(itemSpeech(item));
        }

        if (item.items && item.items.length > 0) {
            setTimeout(() => {
                const currentItems = navigationStack.length === 0 ? APP_DATA.categories : null;
                navigationStack.push({ items: currentItems || getCurrentDisplayedItems(), title: pageTitle.textContent });
                renderLevel(item.items, itemLabel(item));
            }, 400);
        }
    }

    function getCurrentDisplayedItems() {
        // Reconstruct from the grid (ignore back-card, add-card)
        const ids = Array.from(grid.querySelectorAll('.card')).map(c => c.dataset.id).filter(Boolean);
        // Find matching items in data tree
        function findItems(items) {
            const itemIds = items.map(i => i.id);
            if (ids.length === itemIds.length && ids.every((id, j) => id === itemIds[j])) return items;
            for (const item of items) {
                if (item.items) { const f = findItems(item.items); if (f) return f; }
            }
            return null;
        }
        return findItems(APP_DATA.categories) || APP_DATA.categories;
    }

    function speak(text) {
        if (!synth) return;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = I18N.getSpeechLang();
        utterance.rate = 0.9;
        utterance.volume = 1.0;
        const langPrefix = I18N.getSpeechLang().split('-')[0];
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(langPrefix));
        if (voice) utterance.voice = voice;
        synth.speak(utterance);
    }

    function playCustomSound(base64Audio) {
        const audio = new Audio(base64Audio);
        audio.play().catch(() => {});
    }

    // ==================== Global Events ====================
    function bindGlobalEvents() {
        btnSettings.addEventListener('click', openSettings);
        document.getElementById('btn-close-modal').addEventListener('click', closeSettings);
        document.getElementById('btn-close-edit').addEventListener('click', closeEditModal);
        document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);
        document.getElementById('btn-save-edit').addEventListener('click', saveEdit);
        document.getElementById('btn-record').addEventListener('click', startRecording);
        document.getElementById('btn-stop-record').addEventListener('click', stopRecording);
        document.getElementById('btn-play-custom').addEventListener('click', playRecordedSound);
        document.getElementById('btn-reset-image').addEventListener('click', resetImage);
        document.getElementById('btn-reset-sound').addEventListener('click', resetSound);
        document.getElementById('edit-image-input').addEventListener('change', handleImageUpload);
        document.getElementById('btn-delete-symbol').addEventListener('click', () => {
            if (currentEditItem && isCustomItem(currentEditItem.id)) {
                if (confirm(I18N.t('deleteConfirm'))) {
                    deleteCustomSymbol(currentEditItem.id);
                }
            }
        });

        settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettings(); });
        editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

        if (synth) { synth.onvoiceschanged = () => {}; synth.getVoices(); }
    }

    function goBack() {
        if (navigationStack.length === 0) return;
        const prev = navigationStack.pop();
        renderLevel(prev.items, prev.title);
    }

    // ==================== Settings ====================
    function openSettings() {
        const t = I18N.t.bind(I18N);
        const langs = I18N.getLanguages();
        const curLang = I18N.getLang();

        let langButtons = '';
        for (const [code, info] of Object.entries(langs)) {
            const active = code === curLang ? ' active' : '';
            langButtons += `<button class="lang-btn${active}" data-lang="${code}">${info.flag} ${info.name}</button>`;
        }

        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <ul class="settings-list">
                <li class="settings-item">
                    <label>${t('language')}</label>
                </li>
            </ul>
            <div class="lang-picker">${langButtons}</div>
            <ul class="settings-list" style="margin-top:12px">
                <li class="settings-item">
                    <label for="toggle-edit">${t('editMode')}</label>
                    <div class="toggle">
                        <input type="checkbox" id="toggle-edit" ${editMode ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </li>
                <li class="settings-item" id="settings-reset-all">
                    <label>${t('resetAll')}</label>
                    <span style="font-size:1.2rem">🗑️</span>
                </li>
                <li class="settings-item" id="settings-offline-info">
                    <label>${t('offlineInfo')}</label>
                    <span style="font-size:1.2rem">📲</span>
                </li>
            </ul>
            <div style="margin-top:16px;padding:12px;background:#f0f4f8;border-radius:10px;">
                <p style="font-size:0.85rem;color:#64748b;line-height:1.5;">
                    <strong>${t('editMode')}:</strong> ${t('editModeHint')}
                </p>
            </div>
        `;

        // Language buttons
        body.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                I18N.setLanguage(btn.dataset.lang);
                // Reset navigation and re-render
                navigationStack = [];
                renderLevel(APP_DATA.categories, I18N.t('appTitle'));
                closeSettings();
            });
        });

        document.getElementById('toggle-edit').addEventListener('change', (e) => {
            editMode = e.target.checked;
            document.body.classList.toggle('edit-mode', editMode);
            refreshCurrentView();
        });

        document.getElementById('settings-reset-all').addEventListener('click', async () => {
            if (confirm(t('resetConfirm'))) {
                await StorageManager.clearAll();
                customizationsCache = {};
                customItemsMap = {};
                saveCustomItems();
                navigationStack = [];
                renderLevel(APP_DATA.categories, I18N.t('appTitle'));
                closeSettings();
            }
        });

        document.getElementById('settings-offline-info').addEventListener('click', () => {
            showOfflineInfo();
        });

        document.getElementById('modal-title').textContent = t('settings');
        settingsModal.hidden = false;
    }

    function showOfflineInfo() {
        const t = I18N.t.bind(I18N);
        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div class="offline-info">
                <p style="margin-bottom:16px;font-size:1rem;line-height:1.6;">${t('offlineIntro')}</p>
                <div class="offline-platform">${t('offlineAndroid')}</div>
                <div class="offline-platform">${t('offlineIOS')}</div>
                <div class="offline-platform">${t('offlineWindows')}</div>
                <div class="offline-platform">${t('offlineMac')}</div>
                <div style="margin-top:16px;padding:12px;background:#ecfdf5;border-radius:10px;">
                    <p style="font-size:0.9rem;color:#166534;line-height:1.5;">✅ ${t('offlineHint')}</p>
                </div>
            </div>
        `;
        document.getElementById('modal-title').textContent = t('offlineTitle');
    }

    function closeSettings() { settingsModal.hidden = true; }

    // ==================== Edit Modal ====================
    function openEditModal(item) {
        currentEditItem = item;
        isCreatingNew = false;
        const custom = customizationsCache[item.id];
        const t = I18N.t.bind(I18N);

        document.getElementById('edit-modal-title').textContent = `"${itemLabel(item)}" ${t('editTitle')}`;

        const preview = document.getElementById('edit-image-preview');
        if (custom && custom.image) {
            preview.innerHTML = `<img src="${escapeHtml(custom.image)}" alt="">`;
        } else {
            preview.innerHTML = '';
            preview.textContent = item.emoji;
        }

        // Show/hide delete button for custom items
        const delBtn = document.getElementById('btn-delete-symbol');
        if (delBtn) {
            delBtn.hidden = !isCustomItem(item.id);
            delBtn.textContent = t('deleteSymbol');
        }

        // Update UI text for current language
        document.querySelector('#edit-modal-body .edit-section:nth-child(1) h3').textContent = t('changeImage');
        document.querySelector('#edit-modal-body .file-upload-btn').childNodes[0].textContent = t('chooseImage') + ' ';
        document.getElementById('btn-reset-image').textContent = t('resetImage');
        document.querySelector('#edit-modal-body .edit-section:nth-child(2) h3').textContent = t('changeText');
        document.getElementById('edit-label-input').placeholder = t('labelPlaceholder');
        document.getElementById('edit-speech-input').placeholder = t('speechPlaceholder');
        document.querySelector('#edit-modal-body .edit-section:nth-child(3) h3').textContent = t('changeSound');
        document.getElementById('btn-record').textContent = t('record');
        document.getElementById('btn-stop-record').textContent = t('stop');
        document.getElementById('btn-play-custom').textContent = t('listen');
        document.getElementById('btn-reset-sound').textContent = t('resetSound');
        document.getElementById('btn-save-edit').textContent = t('save');
        document.getElementById('btn-cancel-edit').textContent = t('cancel');

        document.getElementById('edit-label-input').value = itemLabel(item);
        document.getElementById('edit-speech-input').value = itemSpeech(item);

        recordedChunks = [];
        document.getElementById('btn-play-custom').hidden = !(custom && custom.sound);
        document.getElementById('btn-stop-record').hidden = true;
        document.getElementById('btn-record').hidden = false;
        document.getElementById('recording-status').textContent = '';

        editModal.hidden = false;
    }

    function openCreateModal() {
        isCreatingNew = true;
        currentEditItem = {
            id: 'custom-' + Date.now(),
            emoji: '⭐',
            i18n: {
                de: { label: '', speech: '' },
                en: { label: '', speech: '' },
                tr: { label: '', speech: '' },
                uk: { label: '', speech: '' },
                ru: { label: '', speech: '' },
            }
        };
        const t = I18N.t.bind(I18N);

        document.getElementById('edit-modal-title').textContent = t('newSymbolTitle');

        const preview = document.getElementById('edit-image-preview');
        preview.innerHTML = '';
        preview.textContent = '⭐';

        document.querySelector('#edit-modal-body .edit-section:nth-child(1) h3').textContent = t('changeImage');
        document.querySelector('#edit-modal-body .file-upload-btn').childNodes[0].textContent = t('chooseImage') + ' ';
        document.getElementById('btn-reset-image').textContent = t('resetImage');
        document.querySelector('#edit-modal-body .edit-section:nth-child(2) h3').textContent = t('changeText');
        document.getElementById('edit-label-input').placeholder = t('labelPlaceholder');
        document.getElementById('edit-speech-input').placeholder = t('speechPlaceholder');
        document.querySelector('#edit-modal-body .edit-section:nth-child(3) h3').textContent = t('changeSound');
        document.getElementById('btn-record').textContent = t('record');
        document.getElementById('btn-stop-record').textContent = t('stop');
        document.getElementById('btn-play-custom').textContent = t('listen');
        document.getElementById('btn-reset-sound').textContent = t('resetSound');
        document.getElementById('btn-save-edit').textContent = t('save');
        document.getElementById('btn-cancel-edit').textContent = t('cancel');

        document.getElementById('edit-label-input').value = '';
        document.getElementById('edit-speech-input').value = '';

        recordedChunks = [];
        document.getElementById('btn-play-custom').hidden = true;
        document.getElementById('btn-stop-record').hidden = true;
        document.getElementById('btn-record').hidden = false;
        document.getElementById('recording-status').textContent = '';

        // Show/hide delete button
        const delBtn = document.getElementById('btn-delete-symbol');
        if (delBtn) delBtn.hidden = true;

        editModal.hidden = false;
    }

    function closeEditModal() {
        editModal.hidden = true;
        currentEditItem = null;
        isCreatingNew = false;
        stopRecordingIfActive();
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    async function saveEdit() {
        if (!currentEditItem) return;
        const itemId = currentEditItem.id;
        const label = document.getElementById('edit-label-input').value.trim();
        const speech = document.getElementById('edit-speech-input').value.trim();

        if (isCreatingNew) {
            // Creating a new custom symbol
            if (!label) return; // require at least a label
            const lang = I18N.getLang();
            const newItem = {
                id: itemId,
                emoji: '⭐',
                i18n: {
                    de: { label: label, speech: speech || label },
                    en: { label: label, speech: speech || label },
                    tr: { label: label, speech: speech || label },
                    uk: { label: label, speech: speech || label },
                    ru: { label: label, speech: speech || label },
                }
            };
            // Override the current language with proper values
            newItem.i18n[lang] = { label: label, speech: speech || label };

            if (!customItemsMap[currentParentId]) customItemsMap[currentParentId] = [];
            customItemsMap[currentParentId].push(newItem);
            saveCustomItems();

            // Save customization (image/sound) if any
            const existing = customizationsCache[itemId] || {};
            const data = { label, speech: speech || label };
            if (existing.image) data.image = existing.image;
            if (recordedChunks.length > 0) {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                data.sound = await blobToBase64(blob);
            }
            await StorageManager.saveCustomization(itemId, data);
            customizationsCache[itemId] = { id: itemId, ...data };
            refreshCurrentView();
            closeEditModal();
            return;
        }

        // Normal edit flow
        const existing = customizationsCache[itemId] || {};
        const txt = getItemText(currentEditItem);
        const data = {
            label: label || txt.label,
            speech: speech || txt.speech,
        };

        if (existing.image !== undefined) data.image = existing.image;
        if (existing.sound !== undefined) data.sound = existing.sound;

        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            data.sound = await blobToBase64(blob);
        }

        await StorageManager.saveCustomization(itemId, data);
        customizationsCache[itemId] = { id: itemId, ...data };
        refreshCurrentView();
        closeEditModal();
    }

    function deleteCustomSymbol(itemId) {
        for (const [parentId, items] of Object.entries(customItemsMap)) {
            const idx = items.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                items.splice(idx, 1);
                if (items.length === 0) delete customItemsMap[parentId];
                saveCustomItems();
                StorageManager.deleteCustomization(itemId);
                delete customizationsCache[itemId];
                refreshCurrentView();
                closeEditModal();
                return;
            }
        }
    }

    function isCustomItem(itemId) {
        for (const items of Object.values(customItemsMap)) {
            if (items.some(i => i.id === itemId)) return true;
        }
        return false;
    }

    function refreshCurrentView() {
        if (navigationStack.length === 0) {
            renderLevel(APP_DATA.categories, I18N.t('appTitle'));
        } else {
            const title = pageTitle.textContent;
            const items = findItemsByTitle(title);
            if (items) renderLevel(items, title);
        }
    }

    function findItemsByTitle(title) {
        function search(items) {
            for (const item of items) {
                if (itemLabel(item) === title && item.items) return item.items;
                if (item.items) { const f = search(item.items); if (f) return f; }
            }
            return null;
        }
        return search(APP_DATA.categories);
    }

    // ==================== Image Upload ====================
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) { alert(I18N.t('imageTooLarge')); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            document.getElementById('edit-image-preview').innerHTML = `<img src="${escapeHtml(dataUrl)}" alt="">`;
            if (!customizationsCache[currentEditItem.id]) {
                customizationsCache[currentEditItem.id] = { id: currentEditItem.id };
            }
            customizationsCache[currentEditItem.id].image = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    function resetImage() {
        if (!currentEditItem) return;
        const preview = document.getElementById('edit-image-preview');
        preview.innerHTML = '';
        preview.textContent = currentEditItem.emoji;
        if (customizationsCache[currentEditItem.id]) delete customizationsCache[currentEditItem.id].image;
    }

    // ==================== Sound Recording ====================
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                document.getElementById('btn-record').hidden = false;
                document.getElementById('btn-stop-record').hidden = true;
                document.getElementById('btn-record').classList.remove('recording');
                document.getElementById('recording-status').textContent = I18N.t('recordingSaved');
                document.getElementById('btn-play-custom').hidden = false;
            };
            mediaRecorder.start();
            document.getElementById('btn-record').hidden = true;
            document.getElementById('btn-stop-record').hidden = false;
            document.getElementById('btn-stop-record').classList.add('recording');
            document.getElementById('recording-status').textContent = I18N.t('recording');
        } catch (err) {
            document.getElementById('recording-status').textContent = I18N.t('micDenied');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            document.getElementById('btn-stop-record').classList.remove('recording');
        }
    }

    function stopRecordingIfActive() {
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    }

    function playRecordedSound() {
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
        } else if (currentEditItem) {
            const c = customizationsCache[currentEditItem.id];
            if (c && c.sound) playCustomSound(c.sound);
        }
    }

    function resetSound() {
        if (!currentEditItem) return;
        recordedChunks = [];
        if (customizationsCache[currentEditItem.id]) delete customizationsCache[currentEditItem.id].sound;
        document.getElementById('btn-play-custom').hidden = true;
        document.getElementById('recording-status').textContent = I18N.t('soundReset');
    }

    function blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
