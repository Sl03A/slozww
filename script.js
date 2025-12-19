// ============================================
// FONCTIONS PRINCIPALES DU PORTFOLIO
// ============================================

/**
 * Initialise le portfolio avec filtrage dynamique
 */
function initPortfolio() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioContainer = document.getElementById('portfolio-container');
    
    // Afficher tous les projets initialement
    renderProjects('all');
    
    // Gérer le clic sur les boutons de filtre
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Récupérer la catégorie à filtrer
            const filter = this.getAttribute('data-filter');
            
            // Afficher les projets filtrés
            renderProjects(filter);
            
            // Mettre à jour le compteur
            updateProjectCount(filter);
            
            // Animation de feedback
            animateFilterChange();
        });
    });
}

/**
 * Rend les projets dans le conteneur
 * @param {string} filter - Catégorie à filtrer
 */
function renderProjects(filter) {
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    
    // Filtrer les projets
    const filteredProjects = filter === 'all' 
        ? projects 
        : projects.filter(project => project.category === filter);
    
    // Générer le HTML des projets
    const projectsHTML = filteredProjects.map(project => `
        <div class="portfolio-item" data-category="${project.category}" data-id="${project.id}">
            <div class="portfolio-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="portfolio-overlay">
                    <div class="overlay-content">
                        <span class="category-tag">${getCategoryLabel(project.category)}</span>
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <div class="project-tags">
                            ${project.tags.map(tag => `<span>${tag}</span>`).join('')}
                        </div>
                        <div class="project-actions">
                            <button class="btn-view-project" data-id="${project.id}">
                                <i class="fas fa-eye"></i> Voir les détails
                            </button>
                            <a href="${project.link}" class="btn-live-demo" target="_blank">
                                <i class="fas fa-external-link-alt"></i> Démo
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="portfolio-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-meta">
                    <span class="client"><i class="fas fa-user"></i> ${project.client}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${project.date}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Mettre à jour le conteneur
    container.innerHTML = projectsHTML;
    
    // Ajouter les événements aux boutons
    attachProjectEvents();
}

/**
 * Attache les événements aux projets
 */
function attachProjectEvents() {
    // Boutons "Voir les détails"
    document.querySelectorAll('.btn-view-project').forEach(button => {
        button.addEventListener('click', function() {
            const projectId = parseInt(this.getAttribute('data-id'));
            showProjectDetails(projectId);
        });
    });
    
    // Boutons "Démo"
    document.querySelectorAll('.btn-live-demo').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                showNotification('La démo sera bientôt disponible !', 'info');
            }
        });
    });
}

/**
 * Affiche les détails d'un projet dans une modal
 * @param {number} projectId - ID du projet
 */
function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    // Remplir la modal
    modalTitle.textContent = project.title;
    modalContent.innerHTML = `
        <div class="modal-project">
            <div class="modal-image">
                <img src="${project.image}" alt="${project.title}">
            </div>
            <div class="modal-details">
                <div class="modal-category">
                    <span class="tag">${getCategoryLabel(project.category)}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${project.date}</span>
                </div>
                <div class="modal-description">
                    <h3>Description du projet</h3>
                    <p>${project.longDescription}</p>
                </div>
                <div class="modal-client">
                    <h4><i class="fas fa-user"></i> Client</h4>
                    <p>${project.client}</p>
                </div>
                <div class="modal-technologies">
                    <h4><i class="fas fa-code"></i> Technologies utilisées</h4>
                    <div class="tech-tags">
                        ${project.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="modal-actions">
                    <a href="${project.link}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Voir le projet
                    </a>
                    <button class="btn btn-secondary btn-close-modal">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Afficher la modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Gérer la fermeture
    const closeButtons = modal.querySelectorAll('.modal-close, .btn-close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

/**
 * Met à jour le compteur de projets
 * @param {string} filter - Catégorie active
 */
function updateProjectCount(filter) {
    const countElement = document.getElementById('project-count');
    if (!countElement) return;
    
    const count = filter === 'all' 
        ? projects.length 
        : projects.filter(p => p.category === filter).length;
    
    countElement.textContent = count;
}

/**
 * Retourne le label d'une catégorie
 * @param {string} category - Catégorie
 * @returns {string} Label formaté
 */
function getCategoryLabel(category) {
    const labels = {
        'all': 'Tous les projets',
        'web': 'Site Web',
        'ecommerce': 'E-commerce',
        'mobile': 'Application Mobile',
        'design': 'Design UI/UX'
    };
    return labels[category] || category;
}

/**
 * Animation lors du changement de filtre
 */
function animateFilterChange() {
    const container = document.getElementById('portfolio-container');
    container.style.opacity = '0.7';
    container.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
    }, 300);
}

// ============================================
// ANIMATION DES STATISTIQUES
// ============================================

/**
 * Initialise l'animation des statistiques
 */
function initStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Observer l'intersection pour déclencher l'animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatNumbers();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    // Observer la section stats
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

/**
 * Anime les nombres des statistiques
 */
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(element => {
        const target = parseInt(element.getAttribute('data-count'));
        const suffix = element.textContent.includes('%') ? '%' : '';
        const duration = 2000; // 2 secondes
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, duration / steps);
    });
}

// ============================================
// GESTION DU PANIER
// ============================================

/**
 * Met à jour le compteur du panier
 */
function updateCartCount() {
    const cartCount = document.querySelector('.panier-count');
    if (!cartCount) return;
    
    // Récupérer le panier depuis localStorage
    const cart = JSON.parse(localStorage.getItem('slozw-cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

/**
 * Ajoute un produit au panier
 * @param {Object} product - Produit à ajouter
 */
function addToCart(product) {
    // Récupérer le panier actuel
    const cart = JSON.parse(localStorage.getItem('slozw-cart') || '[]');
    
    // Vérifier si le produit existe déjà
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('slozw-cart', JSON.stringify(cart));
    
    // Mettre à jour l'affichage
    updateCartCount();
    
    // Afficher une notification
    showNotification(`${product.name} ajouté au panier`, 'success');
}

// ============================================
// MENU MOBILE
// ============================================

/**
 * Initialise le menu mobile
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle || !navLinks) return;
    
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
    
    // Fermer le menu en cliquant sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// ============================================
// ANIMATIONS AU SCROLL
// ============================================

/**
 * Initialise les animations au défilement
 */
function animateOnScroll() {
    const elements = document.querySelectorAll('.portfolio-item, .service-card, .stat-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(element => observer.observe(element));
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Affiche une notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info, warning)
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Créer une notification si elle n'existe pas
    if (!notification.parentNode) {
        const newNotification = document.createElement('div');
        newNotification.id = 'notification';
        newNotification.className = 'notification';
        document.body.appendChild(newNotification);
    }
    
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type, 'show');
    
    // Fermer automatiquement après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    // Fermer au clic
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
    });
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Formatte un prix
 * @param {number} price - Prix à formater
 * @returns {string} Prix formaté
 */
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

/**
 * Vérifie si un élément est dans le viewport
 * @param {HTMLElement} element - Élément à vérifier
 * @returns {boolean} True si visible
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Temps d'attente en ms
 * @returns {Function} Fonction débouncée
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

// Exposer les fonctions globales
window.initPortfolio = initPortfolio;
window.showNotification = showNotification;
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Slozw Portfolio initialisé');
    
    // Initialiser les fonctions selon la page
    if (document.querySelector('.portfolio-items')) {
        initPortfolio();
        initStatsAnimation();
    }
    
    if (document.querySelector('.panier-count')) {
        updateCartCount();
    }
    
    if (document.querySelector('.menu-toggle')) {
        initMobileMenu();
    }
    
    // Animation générale
    animateOnScroll();
});
