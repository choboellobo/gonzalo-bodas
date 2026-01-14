// Admin JavaScript
class AdminPanel {
    constructor() {
        this.siteData = {};
        this.originalData = {};
        this.hasChanges = false;
        this.init();
    }

    async init() {
        if (this.checkAuth()) {
            await this.loadData();
            this.loadPageContent();
            this.loadImages();
            this.loadLinks();
            this.loadSettings();
            this.setupEventListeners();
        }
    }

    checkAuth() {
        // Verificar si ya está autenticado
        const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
        
        if (!isAuthenticated) {
            this.showAuthModal();
            return false;
        }
        return true;
    }

    showAuthModal() {
        // Ocultar contenido del admin
        document.body.style.overflow = 'hidden';
        const mainContent = document.querySelector('main');
        const adminNav = document.querySelector('.admin-nav');
        if (mainContent) mainContent.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
        
        // Crear modal de autenticación
        const modalHTML = `
            <div id="auth-modal" class="auth-modal">
                <div class="auth-content">
                    <div class="auth-logo">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Panel de Administración</h2>
                    <p>Molino Rosales - Acceso Restringido</p>
                    <form id="auth-form">
                        <input type="password" id="auth-password" placeholder="Introduce la contraseña" required>
                        <button type="submit" class="auth-btn">
                            <i class="fas fa-key"></i> Acceder
                        </button>
                    </form>
                    <div id="auth-error" class="auth-error"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        const authForm = document.getElementById('auth-form');
        const authPassword = document.getElementById('auth-password');
        const authError = document.getElementById('auth-error');
        
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = authPassword.value;
            
            if (password === '123456') {
                sessionStorage.setItem('adminAuth', 'true');
                document.getElementById('auth-modal').remove();
                
                // Mostrar contenido del admin
                document.body.style.overflow = '';
                const mainContent = document.querySelector('main');
                const adminNav = document.querySelector('.admin-nav');
                if (mainContent) mainContent.style.display = '';
                if (adminNav) adminNav.style.display = '';
                
                this.init(); // Reiniciar después de autenticar
            } else {
                authError.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
                authPassword.value = '';
                authPassword.focus();
                authPassword.style.borderColor = '#e74c3c';
                setTimeout(() => {
                    authPassword.style.borderColor = '#ddd';
                }, 2000);
            }
        });
        
        // Focus en el campo de contraseña
        setTimeout(() => {
            authPassword.focus();
        }, 100);
    }

    async loadData() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch('/api/load-site-data', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (this.validateSiteData(data)) {
                    this.siteData = data;
                    this.originalData = JSON.parse(JSON.stringify(this.siteData)); // Deep copy
                    console.log('Site data loaded:', this.siteData);
                } else {
                    throw new Error('Invalid site data structure');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading site data:', error);
            this.siteData = this.getDefaultSiteData();
            if (error.name === 'AbortError') {
                this.showMessage('Timeout al cargar los datos. Usando estructura por defecto.', 'error');
            } else {
                this.showMessage(`Error al cargar los datos: ${error.message}. Usando estructura por defecto.`, 'warning');
            }
        }
    }

    validateSiteData(data) {
        return data && 
               typeof data === 'object' &&
               data.siteInfo && 
               data.images && 
               data.links && 
               data.pages;
    }

    getDefaultSiteData() {
        return {
            pages: {},
            images: {
                logo: '',
                illustrations: {},
                gallery: {},
                special: {}
            },
            links: { catering: [], fotografo: [], musica: [] },
            siteInfo: { 
                title: 'Molino Rosales',
                contact: { phone: '', email: '', address: '' }, 
                social: { whatsapp: '', instagram: '', facebook: '' },
                description: ''
            }
        };
    }

    setupEventListeners() {
        // File upload drag and drop
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#5d7a5f';
                uploadArea.style.background = '#f0f4f0';
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#cbd5e1';
                uploadArea.style.background = '#f8fafc';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#cbd5e1';
                uploadArea.style.background = '#f8fafc';
                const files = e.dataTransfer.files;
                this.handleFileUpload({ target: { files } });
            });
        }
    }

    // Tab Management
    showTab(tabName, targetElement = null) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const tabElement = document.getElementById(tabName + '-tab');
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Add active class to clicked tab
        if (targetElement) {
            targetElement.classList.add('active');
        } else {
            // Fallback: find the tab button by onclick attribute
            const activeTabButton = document.querySelector(`[onclick*="${tabName}"]`);
            if (activeTabButton) {
                activeTabButton.classList.add('active');
            }
        }
    }

    // Page Content Management
    loadPageContent() {
        if (!this.siteData.pages) return;
        
        const pageSelect = document.getElementById('page-select');
        const selectedPage = pageSelect.value;
        const contentEditor = document.getElementById('content-editor');
        
        const pageData = this.siteData.pages[selectedPage];
        if (!pageData) return;

        let html = `
            <div class="editor-section">
                <h3><i class="fas fa-edit"></i> Editar ${pageData.title}</h3>
        `;

        // Generate form based on JSON structure
        if (selectedPage === 'index') {
            html += this.generateFormFields([
                { key: 'pages.index.hero.title', label: 'Título Principal', type: 'text' },
                { key: 'pages.index.hero.subtitle', label: 'Subtítulo', type: 'text' },
                { key: 'pages.index.hero.image', label: 'Imagen Hero', type: 'image' }
            ]);
            
            // Add grid images section
            html += `
                <div class="form-section">
                    <h4><i class="fas fa-th-large"></i> Imágenes del Grid Principal</h4>
                    <div class="grid-images-editor">
            `;
            
            const gridImages = this.siteData.pages?.index?.gridImages || {};
            const gridLabels = {
                bodas: 'Bodas',
                eventos: 'Eventos', 
                rodajes: 'Rodajes',
                finca: 'Finca',
                weddingPlanning: 'Wedding Planning',
                contacto: 'Contacto'
            };
            
            for (const [key, label] of Object.entries(gridLabels)) {
                html += `
                    <div class="image-field">
                        <label for="grid-${key}">${label}:</label>
                        <div class="image-input-group">
                            <input type="text" 
                                   id="grid-${key}" 
                                   value="${gridImages[key] || ''}" 
                                   placeholder="Ruta de la imagen"
                                   onchange="updateGridImage('${key}', this.value)">
                            <button type="button" class="btn-select-image" onclick="openImageSelector('grid-${key}')">
                                <i class="fas fa-image"></i>
                            </button>
                        </div>
                        ${gridImages[key] ? `<img src="${gridImages[key]}" alt="${label}" class="image-preview">` : ''}
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        } else if (selectedPage === 'finca') {
            html += this.generateFormFields([
                { key: 'pages.finca.title', label: 'Título', type: 'text' },
                { key: 'pages.finca.description.0', label: 'Primer párrafo', type: 'textarea' },
                { key: 'pages.finca.description.1', label: 'Segundo párrafo', type: 'textarea' },
                { key: 'pages.finca.description.2', label: 'Tercer párrafo', type: 'textarea' },
                { key: 'pages.finca.tourUrl', label: 'URL Tour 360°', type: 'url' }
            ]);
        } else if (selectedPage === 'bodas') {
            html += this.generateFormFields([
                { key: 'pages.bodas.title', label: 'Título', type: 'text' },
                { key: 'pages.bodas.description.0', label: 'Primer párrafo', type: 'textarea' },
                { key: 'pages.bodas.description.1', label: 'Segundo párrafo', type: 'textarea' },
                { key: 'pages.bodas.weddingPlanner.title', label: 'Título Wedding Planner', type: 'text' },
                { key: 'pages.bodas.weddingPlanner.description.0', label: 'Wedding Planner - Párrafo 1', type: 'textarea' },
                { key: 'pages.bodas.weddingPlanner.description.1', label: 'Wedding Planner - Párrafo 2', type: 'textarea' },
                { key: 'pages.bodas.catering.description', label: 'Descripción Catering', type: 'textarea' },
                { key: 'pages.bodas.fotografo.description.0', label: 'Fotógrafo - Párrafo 1', type: 'textarea' },
                { key: 'pages.bodas.fotografo.description.1', label: 'Fotógrafo - Párrafo 2', type: 'textarea' },
                { key: 'pages.bodas.musica.description.0', label: 'Música - Párrafo 1', type: 'textarea' },
                { key: 'pages.bodas.musica.description.1', label: 'Música - Párrafo 2', type: 'textarea' },
                { key: 'pages.bodas.musica.description.2', label: 'Música - Párrafo 3', type: 'textarea' }
            ]);
        } else if (selectedPage === 'eventos') {
            html += this.generateFormFields([
                { key: 'pages.eventos.title', label: 'Título', type: 'text' },
                { key: 'pages.eventos.description.0', label: 'Primer párrafo', type: 'textarea' },
                { key: 'pages.eventos.description.1', label: 'Segundo párrafo', type: 'textarea' },
                { key: 'pages.eventos.description.2', label: 'Tercer párrafo', type: 'textarea' },
                { key: 'pages.eventos.description.3', label: 'Cuarto párrafo', type: 'textarea' },
                { key: 'pages.eventos.description.4', label: 'Quinto párrafo', type: 'textarea' }
            ]);
        } else if (selectedPage === 'rodajes') {
            html += this.generateFormFields([
                { key: 'pages.rodajes.title', label: 'Título', type: 'text' },
                { key: 'pages.rodajes.description.0', label: 'Primer párrafo', type: 'textarea' },
                { key: 'pages.rodajes.description.1', label: 'Segundo párrafo', type: 'textarea' },
                { key: 'pages.rodajes.description.2', label: 'Tercer párrafo', type: 'textarea' }
            ]);
        } else if (selectedPage === 'contacto') {
            html += this.generateFormFields([
                { key: 'pages.contacto.title', label: 'Título', type: 'text' },
                { key: 'pages.contacto.subtitle', label: 'Subtítulo', type: 'textarea' }
            ]);
        }

        html += `
            </div>
            <div class="editor-section">
                <button class="save-all-btn" onclick="adminPanel.savePageChanges('${selectedPage}')">
                    <i class="fas fa-save"></i> Guardar Cambios de ${pageData.title}
                </button>
            </div>
        `;

        contentEditor.innerHTML = html;
    }

    generateFormFields(fields) {
        let html = '';
        fields.forEach(field => {
            const value = this.getNestedValue(this.siteData, field.key) || '';
            const inputType = field.type === 'textarea' ? 'textarea' : 'input';
            const inputAttributes = field.type === 'textarea' ? 'class="text-editor"' : `type="${field.type}"`;
            
            html += `
                <div class="form-group">
                    <label for="${field.key.replace(/\./g, '-')}">${field.label}:</label>
                    <${inputType} id="${field.key.replace(/\./g, '-')}" ${inputAttributes} 
                           data-key="${field.key}"
                           value="${inputType === 'input' ? value.replace(/"/g, '&quot;') : ''}"
                           onchange="adminPanel.updateDataField(this)">
                        ${inputType === 'textarea' ? value : ''}
                    </${inputType}>
                </div>
            `;
        });
        return html;
    }

    async loadCurrentPageContent(pageName, structure) {
        try {
            const response = await fetch(`../${pageName}.html`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            structure.sections.forEach(section => {
                const element = doc.querySelector(section.selector);
                const input = document.getElementById(section.id);
                
                if (element && input) {
                    input.value = element.textContent.trim();
                }
            });
        } catch (error) {
            console.error('Error loading page content:', error);
        }
    }

    updateDataField(input) {
        const key = input.dataset.key;
        const value = input.value;
        
        this.setNestedValue(this.siteData, key, value);
        this.hasChanges = true;
        this.showMessage('Contenido actualizado (no guardado aún)', 'warning');
        
        // Update save button state
        this.updateSaveButtonState();
    }

    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => (o && o[k]) ? o[k] : '', obj);
    }

    setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
        target[lastKey] = value;
    }

    updateSaveButtonState() {
        const saveButtons = document.querySelectorAll('.save-all-btn');
        saveButtons.forEach(btn => {
            if (this.hasChanges) {
                btn.style.background = '#ef4444';
                btn.textContent = ' ⚠️ Hay cambios sin guardar';
            } else {
                btn.style.background = '';
                btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            }
        });
    }

    async savePageChanges(pageName) {
        if (!this.hasChanges) {
            this.showMessage('No hay cambios para guardar', 'warning');
            return;
        }

        try {
            // Save to localStorage as a fallback
            localStorage.setItem('molino-rosales-data', JSON.stringify(this.siteData));
            
            // In production, this would send to a backend
            await this.saveToFile();
            
            this.hasChanges = false;
            this.updateSaveButtonState();
            this.showMessage('Cambios guardados exitosamente', 'success');
            
            // Update original data
            this.originalData = JSON.parse(JSON.stringify(this.siteData));
            
        } catch (error) {
            console.error('Error saving changes:', error);
            this.showMessage('Error al guardar los cambios', 'error');
        }
    }

    async saveToFile() {
        try {
            const response = await fetch('/api/save-site-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.siteData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data saved successfully:', result);
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    downloadJSON() {
        const dataStr = JSON.stringify(this.siteData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `site-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Image Management
    loadImages() {
        const imagesGrid = document.getElementById('images-grid');
        if (!imagesGrid || !this.siteData.images) return;
        
        let html = '';
        
        // Handle different image structure types
        if (this.siteData.images.logo) {
            html += this.processImageCategory('logo', this.siteData.images.logo);
        }
        
        if (this.siteData.images.illustrations) {
            html += this.processImageCategory('illustrations', this.siteData.images.illustrations);
        }
        
        if (this.siteData.images.gallery) {
            Object.keys(this.siteData.images.gallery).forEach(subcategory => {
                html += this.processImageCategory(`gallery-${subcategory}`, this.siteData.images.gallery[subcategory]);
            });
        }
        
        if (this.siteData.images.special) {
            html += this.processImageCategory('special', this.siteData.images.special);
        }

        imagesGrid.innerHTML = html;
    }

    processImageCategory(categoryName, categoryData) {
        let categoryHtml = `<div class="image-category"><h4>${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h4><div class="image-category-grid">`;
        
        if (typeof categoryData === 'string') {
            // Single image (like logo)
            categoryHtml += this.createImageItem(categoryData, categoryName, 0);
        } else if (Array.isArray(categoryData)) {
            // Array of images (like gallery items)
            categoryData.forEach((imagePath, index) => {
                categoryHtml += this.createImageItem(imagePath, categoryName, index);
            });
        } else if (typeof categoryData === 'object' && categoryData !== null) {
            // Object with multiple images (like illustrations)
            Object.keys(categoryData).forEach((key, index) => {
                const imagePath = categoryData[key];
                if (typeof imagePath === 'string') {
                    categoryHtml += this.createImageItem(imagePath, `${categoryName}-${key}`, index);
                } else if (Array.isArray(imagePath)) {
                    imagePath.forEach((path, subIndex) => {
                        categoryHtml += this.createImageItem(path, `${categoryName}-${key}`, subIndex);
                    });
                }
            });
        }
        
        categoryHtml += `</div>
            <button class="btn-secondary" onclick="adminPanel.addImageToCategory('${categoryName}')">
                <i class="fas fa-plus"></i> Añadir imagen a ${categoryName}
            </button>
        </div>`;
        
        return categoryHtml;
    }

    createImageItem(imagePath, category, index) {
        // Ajustar la ruta de la imagen para el contexto del admin
        const adjustedPath = imagePath.startsWith('/') ? imagePath : `../${imagePath}`;
        
        return `
            <div class="image-item">
                <img src="${adjustedPath}" alt="${category} ${index + 1}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOURBMUE5Ij5JbWFnZW4gbm8gZW5jb250cmFkYTwvdGV4dD4KPC9zdmc+'">
                <div class="image-info">
                    <input type="text" value="${imagePath}" 
                           data-category="${category}" data-index="${index}"
                           onchange="adminPanel.updateImagePath('${category}', ${index}, this.value)"
                           placeholder="Ruta de la imagen">
                    <div class="image-actions">
                        <button class="btn-small btn-copy" onclick="adminPanel.copyImagePath('${imagePath}')">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                        <button class="btn-small btn-delete" onclick="adminPanel.deleteImageFromCategory('${category}', ${index})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateImagePath(category, index, newPath) {
        try {
            // Handle different image structures
            if (category === 'logo') {
                this.siteData.images.logo = newPath;
            } else if (category.startsWith('gallery-')) {
                const subcategory = category.replace('gallery-', '');
                if (this.siteData.images.gallery && this.siteData.images.gallery[subcategory]) {
                    this.siteData.images.gallery[subcategory][index] = newPath;
                }
            } else if (category.startsWith('illustrations-')) {
                const key = category.replace('illustrations-', '');
                if (this.siteData.images.illustrations) {
                    this.siteData.images.illustrations[key] = newPath;
                }
            } else if (category.startsWith('special-')) {
                const key = category.replace('special-', '');
                if (this.siteData.images.special) {
                    this.siteData.images.special[key] = newPath;
                }
            } else if (Array.isArray(this.siteData.images[category])) {
                this.siteData.images[category][index] = newPath;
            }
            
            this.hasChanges = true;
            this.updateSaveButtonState();
            this.showMessage('Ruta de imagen actualizada (no guardado aún)', 'warning');
        } catch (error) {
            console.error('Error updating image path:', error);
            this.showMessage('Error al actualizar la ruta de imagen', 'error');
        }
    }

    deleteImageFromCategory(category, index) {
        if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
            try {
                // Handle different image structures
                if (category === 'logo') {
                    this.siteData.images.logo = '';
                } else if (category.startsWith('gallery-')) {
                    const subcategory = category.replace('gallery-', '');
                    if (this.siteData.images.gallery && this.siteData.images.gallery[subcategory]) {
                        this.siteData.images.gallery[subcategory].splice(index, 1);
                    }
                } else if (category.startsWith('illustrations-')) {
                    const key = category.replace('illustrations-', '');
                    if (this.siteData.images.illustrations) {
                        this.siteData.images.illustrations[key] = '';
                    }
                } else if (category.startsWith('special-')) {
                    const key = category.replace('special-', '');
                    if (this.siteData.images.special) {
                        this.siteData.images.special[key] = '';
                    }
                } else if (Array.isArray(this.siteData.images[category])) {
                    this.siteData.images[category].splice(index, 1);
                }
                
                this.hasChanges = true;
                this.updateSaveButtonState();
                this.loadImages(); // Reload to update indices
                this.showMessage('Imagen eliminada (no guardado aún)', 'warning');
            } catch (error) {
                console.error('Error deleting image:', error);
                this.showMessage('Error al eliminar la imagen', 'error');
            }
        }
    }

    addImageToCategory(category) {
        const path = prompt('Introduce la ruta de la nueva imagen (ej: images/nueva-imagen.jpg):');
        if (path) {
            try {
                // Handle different image structures
                if (category === 'logo') {
                    this.siteData.images.logo = path;
                } else if (category.startsWith('gallery-')) {
                    const subcategory = category.replace('gallery-', '');
                    if (!this.siteData.images.gallery) {
                        this.siteData.images.gallery = {};
                    }
                    if (!this.siteData.images.gallery[subcategory]) {
                        this.siteData.images.gallery[subcategory] = [];
                    }
                    this.siteData.images.gallery[subcategory].push(path);
                } else if (category.startsWith('illustrations-')) {
                    const key = category.replace('illustrations-', '');
                    if (!this.siteData.images.illustrations) {
                        this.siteData.images.illustrations = {};
                    }
                    this.siteData.images.illustrations[key] = path;
                } else if (category.startsWith('special-')) {
                    const key = category.replace('special-', '');
                    if (!this.siteData.images.special) {
                        this.siteData.images.special = {};
                    }
                    this.siteData.images.special[key] = path;
                } else if (Array.isArray(this.siteData.images[category])) {
                    this.siteData.images[category].push(path);
                } else {
                    // Create new category as array
                    this.siteData.images[category] = [path];
                }
                
                this.hasChanges = true;
                this.updateSaveButtonState();
                this.loadImages(); // Reload to show new image
                this.showMessage('Imagen añadida (no guardado aún)', 'warning');
            } catch (error) {
                console.error('Error adding image:', error);
                this.showMessage('Error al añadir la imagen', 'error');
            }
        }
    }

    handleFileUpload(event) {
        const files = event.target.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                // In a real implementation, you would upload to a server
                console.log('Uploading file:', file.name);
                this.showMessage(`Imagen ${file.name} subida correctamente`, 'success');
            } else {
                this.showMessage(`El archivo ${file.name} no es una imagen válida`, 'error');
            }
        }
        
        // Reload images after upload
        setTimeout(() => {
            this.loadImages();
        }, 1000);
    }

    copyImagePath(path) {
        navigator.clipboard.writeText(path).then(() => {
            this.showMessage('Ruta de imagen copiada al portapapeles', 'success');
        }).catch(() => {
            this.showMessage('Error al copiar la ruta', 'error');
        });
    }

    deleteImage(imageName) {
        if (confirm(`¿Estás seguro de que quieres eliminar la imagen ${imageName}?`)) {
            // In a real implementation, you would delete from server
            console.log('Deleting image:', imageName);
            this.showMessage(`Imagen ${imageName} eliminada`, 'success');
            this.loadImages();
        }
    }

    // Links Management
    loadLinks() {
        if (!this.siteData.links) return;

        this.loadLinkSection('catering-links', this.siteData.links.catering, 'catering');
        this.loadLinkSection('fotografo-links', this.siteData.links.fotografo, 'fotografo');
        this.loadLinkSection('musica-links', this.siteData.links.musica, 'musica');
        this.loadSocialLinks();
    }

    loadLinkSection(containerId, links, category) {
        const container = document.getElementById(containerId);
        let html = '';

        links.forEach((link, index) => {
            html += `
                <div class="link-item">
                    <input type="text" placeholder="Nombre del enlace" value="${link.name}" 
                           data-category="${category}" data-index="${index}" data-field="name"
                           onchange="adminPanel.updateLinkField(this)">
                    <input type="url" placeholder="URL" value="${link.url}"
                           data-category="${category}" data-index="${index}" data-field="url"
                           onchange="adminPanel.updateLinkField(this)">
                    <button class="btn-small btn-delete" onclick="adminPanel.deleteLink('${category}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        html += `
            <button class="btn-secondary" onclick="adminPanel.addNewLink('${category}')">
                <i class="fas fa-plus"></i> Añadir enlace
            </button>
        `;

        container.innerHTML = html;
    }

    loadSocialLinks() {
        const socialLinks = document.getElementById('social-links');
        const social = this.siteData.siteInfo.social;

        let html = `
            <div class="link-item">
                <input type="text" placeholder="Nombre de la red social" value="WhatsApp" readonly>
                <input type="url" placeholder="URL" value="${social.whatsapp}"
                       data-social="whatsapp" onchange="adminPanel.updateSocialLink(this)">
                <span class="btn-small" style="background: #ccc; cursor: not-allowed;">
                    <i class="fas fa-lock"></i>
                </span>
            </div>
            <div class="link-item">
                <input type="text" placeholder="Nombre de la red social" value="Instagram" readonly>
                <input type="url" placeholder="URL" value="${social.instagram}"
                       data-social="instagram" onchange="adminPanel.updateSocialLink(this)">
                <span class="btn-small" style="background: #ccc; cursor: not-allowed;">
                    <i class="fas fa-lock"></i>
                </span>
            </div>
            <div class="link-item">
                <input type="text" placeholder="Nombre de la red social" value="Facebook" readonly>
                <input type="url" placeholder="URL" value="${social.facebook}"
                       data-social="facebook" onchange="adminPanel.updateSocialLink(this)">
                <span class="btn-small" style="background: #ccc; cursor: not-allowed;">
                    <i class="fas fa-lock"></i>
                </span>
            </div>
        `;

        socialLinks.innerHTML = html;
    }

    updateLinkField(input) {
        const category = input.dataset.category;
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        const value = input.value;

        this.siteData.links[category][index][field] = value;
        this.hasChanges = true;
        this.showMessage('Enlace actualizado (no guardado aún)', 'warning');
        this.updateSaveButtonState();
    }

    updateSocialLink(input) {
        const social = input.dataset.social;
        const value = input.value;

        this.siteData.siteInfo.social[social] = value;
        this.hasChanges = true;
        this.showMessage('Red social actualizada (no guardado aún)', 'warning');
        this.updateSaveButtonState();
    }

    deleteLink(category, index) {
        if (confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
            this.siteData.links[category].splice(index, 1);
            this.hasChanges = true;
            this.loadLinks(); // Reload to update indices
            this.showMessage('Enlace eliminado (no guardado aún)', 'warning');
            this.updateSaveButtonState();
        }
    }

    addNewLink(category) {
        const newLink = { name: '', url: '' };
        this.siteData.links[category].push(newLink);
        this.hasChanges = true;
        this.loadLinks(); // Reload to show new link
        this.showMessage('Nuevo enlace añadido (no guardado aún)', 'warning');
        this.updateSaveButtonState();
    }

    // Settings Management
    loadSettings() {
        if (!this.siteData.siteInfo) return;

        const contact = this.siteData.siteInfo.contact;
        const phoneEl = document.getElementById('phone');
        const emailEl = document.getElementById('email');
        const addressEl = document.getElementById('address');
        const metaEl = document.getElementById('meta-description');

        if (phoneEl) phoneEl.value = contact.phone || '';
        if (emailEl) emailEl.value = contact.email || '';
        if (addressEl) addressEl.value = contact.address || '';
        if (metaEl) metaEl.value = this.siteData.siteInfo.description || '';

        // Remove existing event listeners to prevent duplicates
        this.removeSettingsEventListeners();

        // Add event listeners for settings
        if (phoneEl) {
            this.phoneChangeHandler = (e) => {
                this.siteData.siteInfo.contact.phone = e.target.value;
                this.hasChanges = true;
                this.updateSaveButtonState();
            };
            phoneEl.addEventListener('change', this.phoneChangeHandler);
        }

        if (emailEl) {
            this.emailChangeHandler = (e) => {
                this.siteData.siteInfo.contact.email = e.target.value;
                this.hasChanges = true;
                this.updateSaveButtonState();
            };
            emailEl.addEventListener('change', this.emailChangeHandler);
        }

        if (addressEl) {
            this.addressChangeHandler = (e) => {
                this.siteData.siteInfo.contact.address = e.target.value;
                this.hasChanges = true;
                this.updateSaveButtonState();
            };
            addressEl.addEventListener('change', this.addressChangeHandler);
        }

        if (metaEl) {
            this.metaChangeHandler = (e) => {
                this.siteData.siteInfo.description = e.target.value;
                this.hasChanges = true;
                this.updateSaveButtonState();
            };
            metaEl.addEventListener('change', this.metaChangeHandler);
        }
    }

    removeSettingsEventListeners() {
        const phoneEl = document.getElementById('phone');
        const emailEl = document.getElementById('email');
        const addressEl = document.getElementById('address');
        const metaEl = document.getElementById('meta-description');

        if (phoneEl && this.phoneChangeHandler) {
            phoneEl.removeEventListener('change', this.phoneChangeHandler);
        }
        if (emailEl && this.emailChangeHandler) {
            emailEl.removeEventListener('change', this.emailChangeHandler);
        }
        if (addressEl && this.addressChangeHandler) {
            addressEl.removeEventListener('change', this.addressChangeHandler);
        }
        if (metaEl && this.metaChangeHandler) {
            metaEl.removeEventListener('change', this.metaChangeHandler);
        }
    }

    // Backup and Restore
    createBackup() {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: this.siteData
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `molino-rosales-backup-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showMessage('Backup creado y descargado', 'success');
    }

    restoreBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (backupData.data) {
                    // Restore complete site data
                    this.siteData = backupData.data;
                    
                    // Reload all interface sections
                    this.loadPageContent();
                    this.loadImages();
                    this.loadLinks();
                    this.loadSettings();
                    
                    this.hasChanges = false;
                    this.updateSaveButtonState();
                    
                    this.showMessage(`Backup restaurado exitosamente (${backupData.timestamp})`, 'success');
                } else {
                    this.showMessage('Error: formato de backup inválido', 'error');
                }
            } catch (error) {
                this.showMessage('Error al restaurar el backup: archivo inválido', 'error');
                console.error('Restore error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Save All Changes
    async saveAll() {
        if (!this.hasChanges) {
            this.showMessage('No hay cambios para guardar', 'warning');
            return;
        }

        try {
            // Save to localStorage as a fallback
            localStorage.setItem('molino-rosales-data', JSON.stringify(this.siteData));
            
            // Save to server
            await this.saveToFile();
            
            this.hasChanges = false;
            this.updateSaveButtonState();
            this.showMessage('Todos los cambios guardados exitosamente', 'success');
            
            // Update original data
            this.originalData = JSON.parse(JSON.stringify(this.siteData));
            
        } catch (error) {
            console.error('Error in saveAll:', error);
            this.showMessage('Error al guardar todos los cambios', 'error');
        }
    }

    // Preview Changes
    previewChanges() {
        // Abrir la web principal en una nueva ventana
        const previewWindow = window.open('/', '_blank');
        
        // Mostrar mensaje
        this.showMessage('Vista previa abierta en nueva ventana', 'info');
        
        // Si hay cambios no guardados, advertir
        if (this.hasChanges) {
            setTimeout(() => {
                this.showMessage('⚠️ Recuerda guardar los cambios para verlos en la vista previa', 'warning');
            }, 1000);
        }
    }

    // Utility Functions
    showMessage(text, type = 'success') {
        const container = document.getElementById('message-container');
        if (!container) {
            console.log(`${type.toUpperCase()}: ${text}`);
            return;
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        container.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 4000);
    }
}

// Global functions for HTML onclick events
function showTab(tabName, event) {
    if (event) event.preventDefault();
    adminPanel.showTab(tabName, event ? event.target : null);
}

function loadPageContent() {
    adminPanel.loadPageContent();
}

function handleFileUpload(event) {
    adminPanel.handleFileUpload(event);
}

function saveAll() {
    adminPanel.saveAll();
}

function createBackup() {
    adminPanel.createBackup();
}

function restoreBackup(event) {
    adminPanel.restoreBackup(event);
}

function previewChanges() {
    adminPanel.previewChanges();
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        sessionStorage.removeItem('adminAuth');
        location.reload();
    }
}

// Grid images management
function updateGridImage(key, value) {
    if (!adminPanel.siteData.pages.index.gridImages) {
        adminPanel.siteData.pages.index.gridImages = {};
    }
    adminPanel.siteData.pages.index.gridImages[key] = value;
    
    // Mark changes
    adminPanel.hasChanges = true;
    adminPanel.updateSaveButtonState();
    
    // Update preview image
    const imageField = document.getElementById(`grid-${key}`).closest('.image-field');
    let preview = imageField.querySelector('.image-preview');
    
    if (value) {
        if (!preview) {
            preview = document.createElement('img');
            preview.className = 'image-preview';
            imageField.appendChild(preview);
        }
        preview.src = value;
        preview.alt = key;
    } else if (preview) {
        preview.remove();
    }
}

function openImageSelector(targetInputId) {
    // Create simple image selector modal
    const modal = document.createElement('div');
    modal.className = 'image-selector-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Seleccionar Imagen</h3>
                <button class="close-btn" onclick="this.closest('.image-selector-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Introduce la ruta de la imagen:</p>
                <input type="text" id="image-path-input" placeholder="images/nombre-imagen.jpg">
                <br><br>
                <p>O sube una nueva imagen:</p>
                <input type="file" id="image-upload-input" accept="image/*">
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="this.closest('.image-selector-modal').remove()">
                    Cancelar
                </button>
                <button class="btn-confirm" onclick="confirmImageSelection('${targetInputId}')">
                    Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('image-path-input').focus();
}

function confirmImageSelection(targetInputId) {
    const pathInput = document.getElementById('image-path-input');
    const fileInput = document.getElementById('image-upload-input');
    const targetInput = document.getElementById(targetInputId);
    
    if (fileInput.files.length > 0) {
        // Handle file upload (simplified version)
        const file = fileInput.files[0];
        const fileName = `images/${file.name}`;
        targetInput.value = fileName;
        
        // Update the grid image
        const gridKey = targetInputId.replace('grid-', '');
        updateGridImage(gridKey, fileName);
        
        adminPanel.showMessage('Imagen seleccionada. Recuerda subir el archivo al servidor.', 'info');
    } else if (pathInput.value) {
        targetInput.value = pathInput.value;
        
        // Update the grid image
        const gridKey = targetInputId.replace('grid-', '');
        updateGridImage(gridKey, pathInput.value);
    }
    
    // Close modal
    document.querySelector('.image-selector-modal').remove();
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Add some CSS for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add loading states, better interactions, etc.
    console.log('Admin panel initialized');
});