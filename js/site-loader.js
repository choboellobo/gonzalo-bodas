// Site Content Loader - Carga contenido dinámico desde JSON
class SiteLoader {
    constructor() {
        this.siteData = {};
        this.init();
    }

    async init() {
        await this.loadSiteData();
        this.updatePageContent();
    }

    async loadSiteData() {
        try {
            const response = await fetch('/api/load-site-data');
            if (response.ok) {
                this.siteData = await response.json();
                console.log('Site data loaded for dynamic content:', this.siteData);
            } else {
                console.warn('Could not load dynamic site data');
            }
        } catch (error) {
            console.warn('Error loading site data:', error);
        }
    }

    updatePageContent() {
        if (!this.siteData.pages) return;

        const currentPage = this.getCurrentPage();
        if (!currentPage || !this.siteData.pages[currentPage]) return;

        const pageData = this.siteData.pages[currentPage];
        
        // Actualizar contenido específico de cada página
        switch (currentPage) {
            case 'index':
                this.updateIndexPage(pageData);
                break;
            case 'finca':
                this.updateFincaPage(pageData);
                break;
            case 'bodas':
                this.updateBodasPage(pageData);
                break;
            case 'eventos':
                this.updateEventosPage(pageData);
                break;
            case 'rodajes':
                this.updateRodajesPage(pageData);
                break;
            case 'contacto':
                this.updateContactoPage(pageData);
                break;
        }

        // Actualizar elementos comunes
        this.updateCommonElements();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path === '/') return 'index';
        if (path.includes('finca.html')) return 'finca';
        if (path.includes('bodas.html')) return 'bodas';
        if (path.includes('eventos.html')) return 'eventos';
        if (path.includes('rodajes.html')) return 'rodajes';
        if (path.includes('contacto.html')) return 'contacto';
        return 'index'; // default
    }

    updateIndexPage(pageData) {
        // Hero image
        if (pageData.hero && pageData.hero.image) {
            this.updateElement('.hero img', null, 'src', pageData.hero.image);
        }

        // Grid images
        if (pageData.gridImages) {
            const gridMappings = [
                { selector: '.grid-item.third:nth-child(1) img', key: 'bodas' },
                { selector: '.grid-item.third:nth-child(2) img', key: 'eventos' },
                { selector: '.grid-item.third:nth-child(3) img', key: 'rodajes' },
                { selector: '.grid-item.finca img', key: 'finca' },
                { selector: '.grid-item.half:nth-child(5) img', key: 'weddingPlanning' },
                { selector: '.grid-item.half:nth-child(6) img', key: 'contacto' }
            ];

            gridMappings.forEach(mapping => {
                if (pageData.gridImages[mapping.key]) {
                    this.updateElement(mapping.selector, null, 'src', pageData.gridImages[mapping.key]);
                }
            });
        }

        // Grid items - actualizar títulos en los overlays (legacy support)
        if (pageData.grid) {
            pageData.grid.forEach((item, index) => {
                const gridItem = document.querySelectorAll('.grid-item')[index];
                if (gridItem) {
                    const title = gridItem.querySelector('.overlay h2, .overlay h3');
                    const img = gridItem.querySelector('img');
                    
                    if (title && item.title) {
                        title.textContent = item.title.toUpperCase();
                    }
                    if (img && item.image) {
                        img.src = item.image;
                    }
                }
            });
        }
    }

    updateFincaPage(pageData) {
        // Actualizar título principal
        this.updateElement('.finca-title', pageData.title);
        
        // Actualizar descripción
        if (pageData.description && Array.isArray(pageData.description)) {
            const descriptionElements = document.querySelectorAll('.description-text');
            pageData.description.forEach((text, index) => {
                if (descriptionElements[index]) {
                    descriptionElements[index].textContent = text;
                }
            });
        }

        // Actualizar galería si existe
        if (this.siteData.images && this.siteData.images.gallery && this.siteData.images.gallery.finca) {
            this.updateGallery('.finca-gallery', this.siteData.images.gallery.finca);
        }

        // Actualizar ilustración de finca
        if (this.siteData.images && this.siteData.images.illustrations && this.siteData.images.illustrations.finca) {
            this.updateElement('.finca-illustration img', null, 'src', this.siteData.images.illustrations.finca);
        }
    }

    updateBodasPage(pageData) {
        // Actualizar título principal
        this.updateElement('.finca-title', pageData.title);
        
        // Actualizar descripción principal
        if (pageData.description && Array.isArray(pageData.description)) {
            const descriptionElements = document.querySelectorAll('.description-text');
            pageData.description.forEach((text, index) => {
                if (descriptionElements[index]) {
                    descriptionElements[index].textContent = text;
                }
            });
        }

        // Catering section
        if (pageData.catering) {
            this.updateElement('.catering-section h2', pageData.catering.title);
            this.updateElement('.catering-section .service-description', pageData.catering.description);
        }

        // Enlaces de catering - solo actualizar si es necesario
        if (this.siteData.links && this.siteData.links.catering) {
            this.updateCateringLinks();
        }

        // Galería de bodas
        if (this.siteData.images && this.siteData.images.gallery && this.siteData.images.gallery.bodas) {
            this.updateGallery('.bodas-gallery', this.siteData.images.gallery.bodas);
        }

        // Actualizar ilustración
        if (this.siteData.images && this.siteData.images.illustrations && this.siteData.images.illustrations.bodas) {
            this.updateElement('.finca-illustration img', null, 'src', this.siteData.images.illustrations.bodas);
        }
    }

    updateEventosPage(pageData) {
        // Actualizar título principal
        this.updateElement('.finca-title', pageData.title);
        
        // Actualizar descripción
        if (pageData.description && Array.isArray(pageData.description)) {
            const descriptionElements = document.querySelectorAll('.description-text');
            pageData.description.forEach((text, index) => {
                if (descriptionElements[index]) {
                    descriptionElements[index].textContent = text;
                }
            });
        }

        // Enlaces de música
        if (this.siteData.links && this.siteData.links.musica) {
            this.updateLinksList('.musica-links', this.siteData.links.musica);
        }

        // Actualizar ilustración
        if (this.siteData.images && this.siteData.images.illustrations && this.siteData.images.illustrations.eventos) {
            this.updateElement('.finca-illustration img', null, 'src', this.siteData.images.illustrations.eventos);
        }
    }

    updateRodajesPage(pageData) {
        // Actualizar título principal
        this.updateElement('.finca-title', pageData.title);
        
        // Actualizar descripción
        if (pageData.description && Array.isArray(pageData.description)) {
            const descriptionElements = document.querySelectorAll('.description-text');
            pageData.description.forEach((text, index) => {
                if (descriptionElements[index]) {
                    descriptionElements[index].textContent = text;
                }
            });
        }

        // Enlaces de fotografía
        if (this.siteData.links && this.siteData.links.fotografo) {
            this.updateLinksList('.fotografia-links', this.siteData.links.fotografo);
        }

        // Imagen especial de rodajes
        if (this.siteData.images && this.siteData.images.special && this.siteData.images.special.rodajes) {
            this.updateElement('.rodajes-special-image img', null, 'src', this.siteData.images.special.rodajes);
        }

        // Actualizar ilustración
        if (this.siteData.images && this.siteData.images.illustrations && this.siteData.images.illustrations.rodajes) {
            this.updateElement('.finca-illustration img', null, 'src', this.siteData.images.illustrations.rodajes);
        }
    }

    updateContactoPage(pageData) {
        // Actualizar título principal
        this.updateElement('.finca-title', pageData.title);
        
        // Actualizar subtítulo si existe
        if (pageData.subtitle) {
            this.updateElement('.contact-subtitle', pageData.subtitle);
        }

        // Información de contacto
        if (this.siteData.siteInfo && this.siteData.siteInfo.contact) {
            const contact = this.siteData.siteInfo.contact;
            this.updateElement('.contact-phone', contact.phone);
            this.updateElement('.contact-email', contact.email);
            this.updateElement('.contact-address', contact.address);
        }

        // Actualizar ilustración
        if (this.siteData.images && this.siteData.images.illustrations && this.siteData.images.illustrations.contacto) {
            this.updateElement('.finca-illustration img', null, 'src', this.siteData.images.illustrations.contacto);
        }
    }

    updateCommonElements() {
        if (!this.siteData.siteInfo) return;

        // Logo
        if (this.siteData.images && this.siteData.images.logo) {
            this.updateElement('.logo img', null, 'src', this.siteData.images.logo);
        }

        // Título del sitio
        this.updateElement('title', this.siteData.siteInfo.title);
        this.updateElement('.site-title', this.siteData.siteInfo.title);

        // Meta descripción
        if (this.siteData.siteInfo.description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', this.siteData.siteInfo.description);
            }
        }

        // Enlaces sociales
        if (this.siteData.siteInfo.social) {
            const social = this.siteData.siteInfo.social;
            this.updateElement('.social-whatsapp', null, 'href', social.whatsapp);
            this.updateElement('.social-instagram', null, 'href', social.instagram);
            this.updateElement('.social-facebook', null, 'href', social.facebook);
        }

        // Ilustraciones de navegación
        if (this.siteData.images && this.siteData.images.illustrations) {
            Object.keys(this.siteData.images.illustrations).forEach(key => {
                const imagePath = this.siteData.images.illustrations[key];
                this.updateElement(`.nav-${key} img`, null, 'src', imagePath);
            });
        }
    }

    updateElement(selector, content, attribute = null, value = null) {
        const element = document.querySelector(selector);
        if (element) {
            if (attribute && value !== null) {
                element.setAttribute(attribute, value);
            } else if (content !== null && content !== undefined) {
                if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
                    element.value = content;
                } else {
                    element.textContent = content;
                }
            }
        }
    }

    updateLinksList(selector, links) {
        const container = document.querySelector(selector);
        if (!container || !Array.isArray(links)) return;

        // Verificar si ya tiene el formato correcto
        const existingLinks = container.querySelectorAll('a');
        
        if (existingLinks.length === links.length) {
            // Actualizar enlaces existentes manteniendo el formato
            existingLinks.forEach((linkElement, index) => {
                if (links[index]) {
                    linkElement.href = links[index].url;
                    const nameSpan = linkElement.querySelector('.catering-name, .link-name');
                    if (nameSpan) {
                        nameSpan.textContent = links[index].name;
                    } else {
                        linkElement.textContent = links[index].name;
                    }
                }
            });
        } else {
            // Crear nuevos enlaces con el formato de catering
            container.innerHTML = '';
            links.forEach(link => {
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.className = 'catering-link';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'catering-name';
                nameSpan.textContent = link.name;
                
                const icon = document.createElement('i');
                icon.className = 'fas fa-external-link-alt';
                
                linkElement.appendChild(nameSpan);
                linkElement.appendChild(icon);
                container.appendChild(linkElement);
            });
        }
    }

    updateGallery(selector, images) {
        const gallery = document.querySelector(selector);
        if (!gallery || !Array.isArray(images)) return;

        // Si ya existe una galería, actualizar las imágenes
        const existingImages = gallery.querySelectorAll('img');
        existingImages.forEach((img, index) => {
            if (images[index]) {
                img.src = images[index];
            }
        });

        // Si hay más imágenes en JSON que en HTML, agregarlas
        if (images.length > existingImages.length) {
            for (let i = existingImages.length; i < images.length; i++) {
                const imgElement = document.createElement('img');
                imgElement.src = images[i];
                imgElement.alt = `Galería ${i + 1}`;
                imgElement.onclick = () => openLightbox(images[i]);
                gallery.appendChild(imgElement);
            }
        }
    }

    updateCateringLinks() {
        const cateringContainer = document.querySelector('.catering-links');
        if (!cateringContainer || !this.siteData.links.catering) return;

        const existingLinks = cateringContainer.querySelectorAll('.catering-link');
        const cateringData = this.siteData.links.catering;

        // Actualizar enlaces existentes manteniendo el formato
        existingLinks.forEach((linkElement, index) => {
            if (cateringData[index]) {
                linkElement.href = cateringData[index].url;
                const nameSpan = linkElement.querySelector('.catering-name');
                if (nameSpan) {
                    nameSpan.textContent = cateringData[index].name;
                }
            }
        });

        // Si hay más enlaces en el JSON, agregarlos
        if (cateringData.length > existingLinks.length) {
            for (let i = existingLinks.length; i < cateringData.length; i++) {
                const linkData = cateringData[i];
                const linkElement = document.createElement('a');
                linkElement.href = linkData.url;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.className = 'catering-link';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'catering-name';
                nameSpan.textContent = linkData.name;
                
                const icon = document.createElement('i');
                icon.className = 'fas fa-external-link-alt';
                
                linkElement.appendChild(nameSpan);
                linkElement.appendChild(icon);
                cateringContainer.appendChild(linkElement);
            }
        }
    }

    // Método para recargar datos (útil para desarrollo)
    async reload() {
        console.log('🔄 Recargando contenido del sitio...');
        await this.loadSiteData();
        this.updatePageContent();
        console.log('✅ Site content reloaded from JSON');
    }

    // Debug: mostrar información del estado actual
    debug() {
        console.log('🔍 Site Loader Debug Info:');
        console.log('📄 Current page:', this.getCurrentPage());
        console.log('📊 Site data:', this.siteData);
        console.log('🎯 Page data:', this.siteData.pages?.[this.getCurrentPage()]);
        
        // Verificar si los elementos existen
        const currentPage = this.getCurrentPage();
        console.log('🔍 Checking elements for page:', currentPage);
        console.log('Title element (.finca-title):', document.querySelector('.finca-title'));
        console.log('Description elements (.description-text):', document.querySelectorAll('.description-text'));
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.siteLoader = new SiteLoader();
});

// Funciones globales para desarrollo
window.reloadSiteContent = () => {
    if (window.siteLoader) {
        window.siteLoader.reload();
    }
};

window.debugSiteLoader = () => {
    if (window.siteLoader) {
        window.siteLoader.debug();
    }
};

// Auto-recarga cada 30 segundos en desarrollo (comentar en producción)
// setInterval(() => {
//     if (window.siteLoader && window.location.hostname === 'localhost') {
//         window.siteLoader.reload();
//     }
// }, 30000);