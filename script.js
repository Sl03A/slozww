// =============================================
// =============================================
// INTÉGRATION DU SYSTÈME DE COMPTE CLIENT
// =============================================

// Initialiser l'authentification
const auth = new AuthSystem();

// Modifier la fonction d'initialisation pour inclure l'auth
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM entièrement chargé');
    
    // Initialiser l'authentification
    auth.init();
    
    // Initialiser le popup de cookies
    initCookiePopup();
    
    // Initialiser le compteur du panier
    updatePanierCount();
    
    // Initialiser les filtres BOUTIQUE
    initBoutiqueFilters();
    
    // Initialiser les filtres PORTFOLIO
    initPortfolioFilters();
    
    // ... le reste du code existant ...
    
    // MODIFIER la partie panier pour associer les commandes à l'utilisateur
    document.getElementById('proceedCheckout')?.addEventListener('click', function() {
        if (panier.length === 0) {
            showNotification('Votre panier est vide', 'error');
            return;
        }
        
        // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
        if (!auth.isLoggedIn()) {
            localStorage.setItem('redirectAfterLogin', 'boutique.html');
            localStorage.setItem('pendingCart', JSON.stringify(panier));
            openCheckoutModal(); // Ouvrir quand même pour montrer l'étape 1
            showNotification('Connectez-vous pour finaliser votre commande', 'info');
            return;
        }
        
        // Préparer les données de la commande
        const user = auth.getCurrentUser();
        const orderData = {
            id: Date.now().toString(),
            userId: user.id,
            date: new Date().toISOString(),
            reference: 'SLZW-' + Date.now().toString().slice(-6),
            articles: [...panier],
            total: panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0),
            status: 'pending',
            client: {
                name: user.name,
                email: user.email,
                phone: document.getElementById('checkoutPhone')?.value || user.phone || '',
                company: document.getElementById('checkoutCompany')?.value || user.company || '',
                notes: document.getElementById('checkoutNotes')?.value || ''
            }
        };
        
        // Sauvegarder la commande
        const orders = JSON.parse(localStorage.getItem('userOrders')) || [];
        orders.push(orderData);
        localStorage.setItem('userOrders', JSON.stringify(orders));
        
        // Envoyer l'email de commande
        if (orderData.client.email) {
            sendOrderEmail(orderData);
        }
        
        closePanierModal();
        openCheckoutModal();
    });
    
    // ... le reste du code existant ...
});




// GESTION DU POPUP COOKIES (Nouveau système)
// =============================================

function initCookiePopup() {
    const cookiePopup = document.getElementById('cookiePopup');
    const cookieAccept = document.getElementById('cookiePopupAccept');
    const cookieReject = document.getElementById('cookiePopupReject');
    const cookieClose = document.getElementById('cookiePopupClose');
    
    if (!cookiePopup || !cookieAccept || !cookieReject || !cookieClose) {
        return;
    }
    
    const cookieChoice = localStorage.getItem('cookieChoice');
    
    if (!cookieChoice) {
        setTimeout(() => {
            cookiePopup.classList.add('show');
        }, 1000);
    } else {
        cookiePopup.style.display = 'none';
    }
    
    cookieAccept.addEventListener('click', function() {
        localStorage.setItem('cookieChoice', 'accepted');
        cookiePopup.classList.remove('show');
        cookiePopup.classList.add('hide');
        
        setTimeout(() => {
            cookiePopup.style.display = 'none';
        }, 500);
        
        showNotification('Préférences de cookies enregistrées', 'success');
    });
    
    cookieReject.addEventListener('click', function() {
        localStorage.setItem('cookieChoice', 'rejected');
        cookiePopup.classList.remove('show');
        cookiePopup.classList.add('hide');
        
        setTimeout(() => {
            cookiePopup.style.display = 'none';
        }, 500);
        
        showNotification('Préférences de cookies enregistrées', 'success');
    });
    
    cookieClose.addEventListener('click', function() {
        cookiePopup.classList.remove('show');
        cookiePopup.classList.add('hide');
        
        setTimeout(() => {
            cookiePopup.style.display = 'none';
        }, 500);
        
        if (!cookieChoice) {
            localStorage.setItem('cookieChoice', 'closed');
        }
    });
}

function resetCookiePreferences() {
    localStorage.removeItem('cookieChoice');
    
    const cookiePopup = document.getElementById('cookiePopup');
    if (cookiePopup) {
        cookiePopup.style.display = 'block';
        setTimeout(() => {
            cookiePopup.classList.remove('hide');
            cookiePopup.classList.add('show');
        }, 10);
    }
}

// =============================================
// FONCTIONS DE FILTRAGE BOUTIQUE & PORTFOLIO
// =============================================

let codesPromo = {
    "SLZW10": {
        type: "pourcentage",
        valeur: 10,
        description: "-10% sur toute commande",
        actif: true,
        dateFin: "2024-12-31"
    },
    "SLZW15": {
        type: "pourcentage", 
        valeur: 15,
        description: "-15% pour première commande",
        premiereCommande: true,
        actif: true
    },
    "PARRAIN20": {
        type: "montant",
        valeur: 20,
        description: "-20€ parrainage",
        actif: true,
        minMontant: 100
    },
    "ETE2024": {
        type: "pourcentage",
        valeur: 20,
        description: "-20% offre estivale",
        actif: true,
        dateFin: "2024-09-30"
    },
    "LOYAL10": {
        type: "pourcentage",
        valeur: 10,
        description: "-10% fidélité",
        actif: true,
        minCommandes: 2
    }
};

let promoActuel = null;

function openPromoModal() {
    document.getElementById('promoModal').classList.add('active');
    document.getElementById('promoCodeInput').focus();
}

function closePromoModal() {
    document.getElementById('promoModal').classList.remove('active');
    document.getElementById('promoMessage').textContent = '';
    document.getElementById('promoMessage').className = 'promo-message';
}

function showPromoCodes() {
    let message = "📋 Codes promotionnels disponibles :\n\n";
    for (let code in codesPromo) {
        if (codesPromo[code].actif) {
            message += `• ${code} : ${codesPromo[code].description}\n`;
        }
    }
    message += "\n🎁 SLZW15 réservé aux premières commandes";
    alert(message);
}

function applyPromoCode() {
    const codeInput = document.getElementById('promoCodeInput').value.toUpperCase().trim();
    const messageDiv = document.getElementById('promoMessage');
    
    if (!codeInput) {
        messageDiv.textContent = "Veuillez entrer un code promo";
        messageDiv.className = "promo-message error";
        return;
    }
    
    if (!codesPromo[codeInput]) {
        messageDiv.textContent = "Code promo invalide";
        messageDiv.className = "promo-message error";
        return;
    }
    
    const code = codesPromo[codeInput];
    
    if (!code.actif) {
        messageDiv.textContent = "Ce code promo n'est plus actif";
        messageDiv.className = "promo-message error";
        return;
    }
    
    if (code.dateFin) {
        const today = new Date();
        const expiryDate = new Date(code.dateFin);
        if (today > expiryDate) {
            messageDiv.textContent = "Ce code promo a expiré";
            messageDiv.className = "promo-message error";
            return;
        }
    }
    
    if (code.premiereCommande) {
        const hasPreviousOrders = localStorage.getItem('hasOrders') === 'true';
        if (hasPreviousOrders) {
            messageDiv.textContent = "Ce code est réservé à la première commande";
            messageDiv.className = "promo-message error";
            return;
        }
    }
    
    const sousTotal = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    if (code.minMontant && sousTotal < code.minMontant) {
        messageDiv.textContent = `Minimum ${code.minMontant}€ pour ce code`;
        messageDiv.className = "promo-message error";
        return;
    }
    
    promoActuel = {
        code: codeInput,
        type: code.type,
        valeur: code.valeur,
        description: code.description
    };
    
    localStorage.setItem('promoCode', JSON.stringify(promoActuel));
    
    messageDiv.textContent = `✅ Code appliqué : ${code.description}`;
    messageDiv.className = "promo-message success";
    
    updatePanierDisplay();
    
    setTimeout(() => {
        closePromoModal();
        if (document.getElementById('panierModal').classList.contains('show')) {
            updatePromoDisplay();
        }
    }, 1500);
}

function updatePromoDisplay() {
    const promoSection = document.getElementById('promoSection');
    const sousTotalEl = document.getElementById('sousTotal');
    const promoDiscountEl = document.getElementById('promoDiscount');
    const totalPanierEl = document.getElementById('totalPanier');
    const promoDiscountText = document.getElementById('promoDiscountText');
    const promoTotalRow = document.querySelector('.promo-total');
    
    if (!promoActuel) {
        if (promoSection) promoSection.style.display = 'none';
        if (promoTotalRow) promoTotalRow.style.display = 'none';
        return;
    }
    
    const sousTotal = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    let discount = 0;
    
    if (promoActuel.type === 'pourcentage') {
        discount = sousTotal * (promoActuel.valeur / 100);
    } else if (promoActuel.type === 'montant') {
        discount = promoActuel.valeur;
    }
    
    if (discount > sousTotal) {
        discount = sousTotal;
    }
    
    const total = sousTotal - discount;
    
    if (promoSection) promoSection.style.display = 'block';
    if (promoTotalRow) promoTotalRow.style.display = 'flex';
    
    if (sousTotalEl) sousTotalEl.textContent = sousTotal.toFixed(2) + '€';
    if (promoDiscountEl) promoDiscountEl.textContent = '-' + discount.toFixed(2) + '€';
    if (totalPanierEl) totalPanierEl.textContent = total.toFixed(2) + '€';
    if (promoDiscountText) promoDiscountText.textContent = `${promoActuel.code} : ${promoActuel.description}`;
}

function removePromo() {
    promoActuel = null;
    localStorage.removeItem('promoCode');
    updatePanierDisplay();
    showNotification('Réduction supprimée', 'success');
}

// =============================================
// SYSTÈME D'EMAILS AUTOMATIQUES
// =============================================

function sendWelcomeEmail(email, name = "Client") {
    console.log(`📧 Envoi email bienvenue à: ${email}`);
    
    const templateParams = {
        to_name: name,
        to_email: email,
        guide_url: "https://slozw.com/guides/debuter-en-ligne.pdf",
        site_url: "https://slozw.com",
        date: new Date().toLocaleDateString('fr-FR')
    };
    
    emailjs.send("service_slozw", "template_bienvenue", templateParams)
        .then(function(response) {
            console.log('✅ Email bienvenue envoyé:', response.status, response.text);
            localStorage.setItem(`emailSent_${email}`, 'true');
        }, function(error) {
            console.log('❌ Erreur email:', error);
        });
}

function sendOrderEmail(orderData) {
    console.log(`📧 Envoi email commande à: ${orderData.client.email}`);
    
    const orderDetails = orderData.articles.map(item => 
        `• ${item.nom} (×${item.quantite}) : ${item.prix * item.quantite}€`
    ).join('\n');
    
    const templateParams = {
        to_name: orderData.client.name,
        to_email: orderData.client.email,
        order_reference: orderData.reference,
        order_date: new Date(orderData.date).toLocaleDateString('fr-FR'),
        order_total: orderData.total + '€',
        order_details: orderDetails,
        next_steps: `1. Appel de briefing sous 24h\n2. Maquettes sous 3-5 jours\n3. Développement sous 7-10 jours`,
        contact_email: "contact@slozw.com",
        contact_phone: "+33 1 23 45 67 89"
    };
    
    emailjs.send("service_slozw", "template_commande", templateParams)
        .then(function(response) {
            console.log('✅ Email commande envoyé');
            
            localStorage.setItem('hasOrders', 'true');
            
            setTimeout(() => {
                sendFollowupEmail(orderData);
            }, 3 * 24 * 60 * 60 * 1000);
        });
}

function sendFollowupEmail(orderData) {
    console.log(`📧 Envoi email suivi à: ${orderData.client.email}`);
    
    const templateParams = {
        to_name: orderData.client.name,
        to_email: orderData.client.email,
        project_name: orderData.articles[0]?.nom || "Votre projet",
        days_since: 3,
        feedback_link: "https://slozw.com/feedback",
        support_email: "support@slozw.com"
    };
    
    emailjs.send("service_slozw", "template_suivi", templateParams)
        .then(function(response) {
            console.log('✅ Email suivi envoyé');
        });
}

function sendBirthdayEmail(email, name) {
    const templateParams = {
        to_name: name,
        to_email: email,
        discount_code: "ANNIV2024",
        discount_value: "20%",
        valid_until: "7 jours"
    };
    
    emailjs.send("service_slozw", "template_anniversaire", templateParams)
        .then(function(response) {
            console.log('✅ Email anniversaire envoyé');
        });
}

// =============================================
// GESTION DU PANIER - BOUTIQUE
// =============================================

let panier = JSON.parse(localStorage.getItem('panier')) || [];

function updatePanierCount() {
    const count = panier.reduce((total, item) => total + item.quantite, 0);
    document.querySelectorAll('.panier-count').forEach(el => {
        el.textContent = count;
    });
}

function openPanierModal() {
    const modal = document.getElementById('panierModal');
    if (modal) {
        modal.classList.add('show');
        updatePanierDisplay();
        document.body.style.overflow = 'hidden';
    }
}

function closePanierModal() {
    const modal = document.getElementById('panierModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        updateCheckoutSummary();
        generateOrderReference();
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function updatePanierDisplay() {
    const container = document.getElementById('panierItems');
    const totalElement = document.getElementById('totalPanier');
    const sousTotalElement = document.getElementById('sousTotal');
    const promoDiscountElement = document.getElementById('promoDiscount');
    const promoTotalRow = document.querySelector('.promo-total');
    
    if (!container || !totalElement) return;
    
    if (panier.length === 0) {
        container.innerHTML = `
            <div class="panier-vide">
                <i class="fas fa-shopping-basket"></i>
                <p>Votre panier est vide</p>
                <button class="btn btn-outline" onclick="closePanierModal(); openPromoModal()">
                    <i class="fas fa-ticket-alt"></i> Utiliser un code promo
                </button>
                <a href="boutique.html" class="btn btn-primary">Continuer vos achats</a>
            </div>
        `;
        totalElement.textContent = '0€';
        if (sousTotalElement) sousTotalElement.textContent = '0€';
        if (promoDiscountElement) promoDiscountElement.textContent = '-0€';
        if (promoTotalRow) promoTotalRow.style.display = 'none';
        return;
    }
    
    let sousTotal = 0;
    container.innerHTML = '';
    
    panier.forEach(item => {
        const itemTotal = item.prix * item.quantite;
        sousTotal += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'panier-item';
        div.innerHTML = `
            <div class="panier-item-info">
                <h4>${item.nom}</h4>
                <p>${item.prix}€ × ${item.quantite}</p>
            </div>
            <div class="panier-item-actions">
                <span class="panier-item-total">${itemTotal}€</span>
                <button class="btn-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
    
    let discount = 0;
    if (promoActuel) {
        if (promoActuel.type === 'pourcentage') {
            discount = sousTotal * (promoActuel.valeur / 100);
        } else if (promoActuel.type === 'montant') {
            discount = promoActuel.valeur;
        }
        
        if (discount > sousTotal) {
            discount = sousTotal;
        }
    }
    
    const total = sousTotal - discount;
    
    if (sousTotalElement) sousTotalElement.textContent = sousTotal.toFixed(2) + '€';
    if (promoDiscountElement) {
        promoDiscountElement.textContent = '-' + discount.toFixed(2) + '€';
        promoDiscountElement.style.color = '#10b981';
        promoDiscountElement.style.fontWeight = 'bold';
    }
    totalElement.textContent = total.toFixed(2) + '€';
    
    if (promoTotalRow) {
        if (discount > 0) {
            promoTotalRow.style.display = 'flex';
        } else {
            promoTotalRow.style.display = 'none';
        }
    }
    
    updatePromoDisplay();
    
    if (!promoActuel) {
        const promoBtn = document.createElement('button');
        promoBtn.className = 'btn-promo';
        promoBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Utiliser un code promo';
        promoBtn.onclick = openPromoModal;
        container.parentNode.insertBefore(promoBtn, container.nextSibling);
    }
}

function updateCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const totalElement = document.getElementById('checkoutTotal');
    
    if (!container || !totalElement) return;
    
    if (panier.length === 0) {
        container.innerHTML = '<p class="text-center">Aucun article dans le panier</p>';
        totalElement.textContent = '0€';
        return;
    }
    
    let total = 0;
    container.innerHTML = '';
    
    panier.forEach(item => {
        const itemTotal = item.prix * item.quantite;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'checkout-item';
        div.innerHTML = `
            <span>${item.nom} (×${item.quantite})</span>
            <span>${itemTotal.toFixed(2)}€</span>
        `;
        container.appendChild(div);
    });
    
    totalElement.textContent = total.toFixed(2) + '€';
}

function generateOrderReference() {
    const refElement = document.getElementById('orderReference');
    if (refElement) {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        refElement.textContent = `SLZW-${timestamp}${random}`;
    }
}

function goToStep(stepNumber) {
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const stepElement = document.getElementById(`step${stepNumber}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
            step.classList.add('active');
        }
    });
}

// =============================================
// FONCTIONS DE FILTRAGE CORRIGÉES
// =============================================

// Filtrer les produits par catégorie (BOUTIQUE)
function filterProducts(category) {
    console.log('🚀 filterProducts appelé avec catégorie:', category);
    
    const products = document.querySelectorAll('.produit-card');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    if (products.length === 0 || categoryBtns.length === 0) {
        console.log('❌ Pas sur la page boutique ou éléments non trouvés');
        return;
    }
    
    // Mettre à jour les boutons actifs
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
        const btnCategory = btn.dataset.category;
        if (btnCategory === category) {
            btn.classList.add('active');
            console.log('✅ Bouton activé:', btn.textContent);
        }
    });
    
    // Filtrer les produits
    let produitsAffiches = 0;
    products.forEach(product => {
        const productCategory = product.dataset.category;
        
        if (category === 'all' || productCategory === category) {
            product.style.display = 'block';
            produitsAffiches++;
            
            setTimeout(() => {
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
            }, 50);
        } else {
            product.style.opacity = '0';
            product.style.transform = 'translateY(20px)';
            setTimeout(() => {
                product.style.display = 'none';
            }, 300);
        }
    });
    
    console.log(`🎉 ${produitsAffiches} produits affichés pour la catégorie ${category}`);
    
    // Notification visuelle
    showNotification(`${produitsAffiches} produits ${category === 'all' ? 'affichés' : category}`, 'success');
}

// Filtrer les projets portfolio
function filterPortfolio(filter) {
    console.log('🎨 filterPortfolio appelé avec filtre:', filter);
    
    const items = document.querySelectorAll('.portfolio-item');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (items.length === 0 || filterBtns.length === 0) {
        console.log('❌ Pas sur la page portfolio ou éléments non trouvés');
        return;
    }
    
    // Mettre à jour les boutons actifs
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        const btnFilter = btn.dataset.filter;
        if (btnFilter === filter) {
            btn.classList.add('active');
            console.log('✅ Filtre activé:', btn.textContent);
        }
    });
    
    // Filtrer les projets
    let projetsAffiches = 0;
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        
        if (filter === 'all' || itemCategory === filter) {
            item.style.display = 'block';
            projetsAffiches++;
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
    
    console.log(`🎉 ${projetsAffiches} projets affichés pour: ${filter}`);
    
    // Notification visuelle
    showNotification(`${projetsAffiches} projets ${filter === 'all' ? 'affichés' : 'de ' + filter}`, 'success');
}

// =============================================
// INITIALISATION DES FILTRES
// =============================================

// Initialiser les filtres de la boutique
function initBoutiqueFilters() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    console.log('🛒 Initialisation des filtres boutique...');
    console.log('🎯 Boutons de catégorie trouvés:', categoryBtns.length);
    
    if (categoryBtns.length === 0) {
        console.log('❌ Aucun bouton de catégorie trouvé');
        return;
    }
    
    categoryBtns.forEach(btn => {
        console.log('🔘 Bouton trouvé:', btn.textContent, 'data-category:', btn.dataset.category);
        
        // Supprimer les anciens événements et en ajouter un nouveau
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const category = this.dataset.category;
            console.log('👆 Clic sur catégorie boutique:', category);
            filterProducts(category);
        });
    });
    
    console.log('✅ Filtres boutique initialisés');
}

// Initialiser les filtres du portfolio
function initPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    console.log('🎨 Initialisation des filtres portfolio...');
    console.log('🎯 Filtres trouvés:', filterBtns.length);
    
    if (filterBtns.length === 0) {
        console.log('❌ Aucun filtre trouvé');
        return;
    }
    
    filterBtns.forEach(btn => {
        console.log('🔘 Filtre trouvé:', btn.textContent, 'data-filter:', btn.dataset.filter);
        
        // Supprimer les anciens événements et en ajouter un nouveau
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            console.log('👆 Clic sur filtre portfolio:', filter);
            filterPortfolio(filter);
        });
    });
    
    console.log('✅ Filtres portfolio initialisés');
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type, 'show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// =============================================
// ÉVÉNEMENTS ET INITIALISATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM entièrement chargé');
    
    // Initialiser le popup de cookies
    initCookiePopup();
    
    // Initialiser le compteur du panier
    updatePanierCount();
    
    // Initialiser les filtres BOUTIQUE
    initBoutiqueFilters();
    
    // Initialiser les filtres PORTFOLIO
    initPortfolioFilters();
    
    // Charger le code promo sauvegardé
    const savedPromo = localStorage.getItem('promoCode');
    if (savedPromo) {
        promoActuel = JSON.parse(savedPromo);
    }
    
    // Vérifier si l'utilisateur a déjà commandé
    if (!localStorage.getItem('hasOrders')) {
        localStorage.setItem('hasOrders', 'false');
    }
    
    // Gestion du panier (boutique)
    document.querySelectorAll('.panier-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openPanierModal();
        });
    });
    
    // Fermer le panier
    document.querySelector('.close-panier')?.addEventListener('click', closePanierModal);
    
    // Fermer le checkout
    document.querySelector('.close-checkout')?.addEventListener('click', closeCheckoutModal);
    
    // Vider le panier
    document.getElementById('viderPanier')?.addEventListener('click', function() {
        panier = [];
        localStorage.removeItem('panier');
        updatePanierCount();
        updatePanierDisplay();
        showNotification('Panier vidé', 'success');
    });
    
    // Procéder au paiement
    document.getElementById('proceedCheckout')?.addEventListener('click', function() {
        if (panier.length === 0) {
            showNotification('Votre panier est vide', 'error');
            return;
        }
        
        const orderData = {
            date: new Date().toISOString(),
            reference: document.getElementById('orderReference')?.textContent || 'SLZW-' + Date.now(),
            articles: [...panier],
            total: panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0),
            client: {
                name: document.getElementById('checkoutName')?.value || '',
                email: document.getElementById('checkoutEmail')?.value || '',
                phone: document.getElementById('checkoutPhone')?.value || '',
                company: document.getElementById('checkoutCompany')?.value || '',
                notes: document.getElementById('checkoutNotes')?.value || ''
            }
        };
        
        if (orderData.client.email) {
            sendOrderEmail(orderData);
        }
        
        closePanierModal();
        openCheckoutModal();
    });
    
    // Navigation des étapes du checkout
    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', function() {
            const nextStep = this.dataset.next;
            
            if (nextStep === '2') {
                const name = document.getElementById('checkoutName');
                const email = document.getElementById('checkoutEmail');
                const phone = document.getElementById('checkoutPhone');
                
                if (!name.value || !email.value || !phone.value) {
                    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.value)) {
                    showNotification('Veuillez entrer un email valide', 'error');
                    return;
                }
            }
            
            if (nextStep === '3') {
                showNotification('Paiement en cours...', 'info');
                
                setTimeout(() => {
                    const order = {
                        date: new Date().toISOString(),
                        reference: document.getElementById('orderReference').textContent,
                        articles: [...panier],
                        total: panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0),
                        client: {
                            name: document.getElementById('checkoutName').value,
                            email: document.getElementById('checkoutEmail').value,
                            phone: document.getElementById('checkoutPhone').value,
                            company: document.getElementById('checkoutCompany').value,
                            notes: document.getElementById('checkoutNotes').value
                        }
                    };
                    
                    localStorage.setItem('lastOrder', JSON.stringify(order));
                    
                    panier = [];
                    localStorage.removeItem('panier');
                    updatePanierCount();
                    
                    showNotification('Commande confirmée avec succès !', 'success');
                    
                    if (promoActuel?.premiereCommande) {
                        removePromo();
                    }
                }, 1500);
            }
            
            goToStep(parseInt(nextStep));
        });
    });
    
    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', function() {
            const prevStep = this.dataset.prev;
            goToStep(parseInt(prevStep));
        });
    });
    
    // Fermer le checkout après confirmation
    document.getElementById('closeCheckout')?.addEventListener('click', function() {
        closeCheckoutModal();
        window.location.href = 'index.html';
    });
    
    // Retirer un article du panier
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove')) {
            const id = e.target.closest('.btn-remove').dataset.id;
            panier = panier.filter(item => item.id !== id);
            localStorage.setItem('panier', JSON.stringify(panier));
            updatePanierCount();
            updatePanierDisplay();
            updateCheckoutSummary();
            showNotification('Article supprimé du panier', 'success');
        }
    });
    
    // Ajouter un produit au panier (BOUTIQUE)
    document.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.btn-ajouter-panier, .btn-souscrire');
        
        if (addBtn) {
            const id = addBtn.dataset.id;
            const nom = addBtn.dataset.nom;
            const prix = parseFloat(addBtn.dataset.prix);
            
            const existingItem = panier.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantite += 1;
            } else {
                panier.push({
                    id: id,
                    nom: nom,
                    prix: prix,
                    quantite: 1
                });
            }
            
            localStorage.setItem('panier', JSON.stringify(panier));
            updatePanierCount();
            showNotification(`"${nom}" ajouté au panier`, 'success');
        }
    });
    
    // Fermer les modales en cliquant à l'extérieur
    document.querySelectorAll('.panier-modal, .checkout-modal, .promo-modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (this.classList.contains('panier-modal')) {
                    closePanierModal();
                } else if (this.classList.contains('checkout-modal')) {
                    closeCheckoutModal();
                } else if (this.classList.contains('promo-modal')) {
                    closePromoModal();
                }
            }
        });
    });
    
    // Formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            if (!data.name || !data.email || !data.message) {
                showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Veuillez entrer un email valide', 'error');
                return;
            }
            
            console.log('Message envoyé:', data);
            this.reset();
            showNotification('Message envoyé avec succès ! Je vous réponds dans les 24h.', 'success');
        });
    }
    
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Fermer le menu au clic sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.remove('active');
            document.querySelector('.menu-toggle')?.classList.remove('active');
        });
    });
    
    // Copier les coordonnées
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.dataset.text;
            navigator.clipboard.writeText(text)
                .then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copié !';
                    this.style.background = '#10b981';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.background = '';
                    }, 2000);
                    showNotification('Copié dans le presse-papier', 'success');
                })
                .catch(err => {
                    console.error('Erreur de copie:', err);
                    showNotification('Erreur lors de la copie', 'error');
                });
        });
    });
    
    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', function(e) {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (navLinks && navLinks.classList.contains('active') &&
            !navLinks.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
    
    // Empêcher le comportement par défaut des liens vides
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
    
    // Initialiser les animations des produits
    document.querySelectorAll('.produit-card, .portfolio-item').forEach(item => {
        item.style.transition = 'opacity 0.3s, transform 0.3s';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    });
    
    // Initialiser le bouton "Cookies" dans le footer
    const openCookieSettings = document.getElementById('openCookieSettings');
    if (openCookieSettings) {
        openCookieSettings.addEventListener('click', function(e) {
            e.preventDefault();
            resetCookiePreferences();
        });
    }
    
    console.log('✅ Initialisation terminée');
});

// =============================================
// FONCTION DE TEST MANUEL
// =============================================

function testFiltres() {
    console.log('🧪 TEST MANUEL DES FILTRES');
    console.log('==========================');
    
    // Test boutique
    const catBtns = document.querySelectorAll('.category-btn');
    console.log(`🎯 Boutons boutique: ${catBtns.length}`);
    catBtns.forEach((btn, i) => {
        console.log(`${i+1}. ${btn.textContent} -> data-category: "${btn.dataset.category}"`);
    });
    
    // Test portfolio
    const filtreBtns = document.querySelectorAll('.filter-btn');
    console.log(`🎨 Filtres portfolio: ${filtreBtns.length}`);
    filtreBtns.forEach((btn, i) => {
        console.log(`${i+1}. ${btn.textContent} -> data-filter: "${btn.dataset.filter}"`);
    });
    
    // Test produits
    const produits = document.querySelectorAll('.produit-card');
    console.log(`📦 Produits boutique: ${produits.length}`);
    produits.forEach((prod, i) => {
        const title = prod.querySelector('h3')?.textContent || 'Sans titre';
        console.log(`${i+1}. ${title} -> data-category: "${prod.dataset.category}"`);
    });
    
    // Test portfolio items
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    console.log(`🖼️ Items portfolio: ${portfolioItems.length}`);
    portfolioItems.forEach((item, i) => {
        const title = item.querySelector('h3')?.textContent || 'Sans titre';
        console.log(`${i+1}. ${title} -> data-category: "${item.dataset.category}"`);
    });
}
