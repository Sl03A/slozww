// auth.js - Système d'authentification
const AUTH_API_URL = 'https://your-backend-api.com/auth'; // À remplacer par votre API

class AuthSystem {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.updateUI();
    }

    // Inscription
    async register(userData) {
        try {
            // Simulation d'appel API
            console.log('Inscription:', userData);
            
            // Validation
            if (!userData.email || !userData.password || !userData.name) {
                throw new Error('Tous les champs sont obligatoires');
            }

            if (userData.password !== userData.confirmPassword) {
                throw new Error('Les mots de passe ne correspondent pas');
            }

            if (userData.password.length < 6) {
                throw new Error('Le mot de passe doit contenir au moins 6 caractères');
            }

            // Vérifier si l'utilisateur existe déjà
            const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
            if (existingUsers.find(u => u.email === userData.email)) {
                throw new Error('Un compte existe déjà avec cet email');
            }

            // Créer l'utilisateur
            const newUser = {
                id: Date.now().toString(),
                name: userData.name,
                email: userData.email,
                password: this.hashPassword(userData.password), // En production, utiliser bcrypt
                phone: userData.phone || '',
                company: userData.company || '',
                createdAt: new Date().toISOString(),
                role: 'client',
                isActive: true,
                preferences: {
                    newsletter: userData.newsletter || false,
                    notifications: true
                }
            };

            // Sauvegarder
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            
            // Connecter automatiquement
            this.login({ email: userData.email, password: userData.password });
            
            return { success: true, user: this.sanitizeUser(newUser) };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Connexion
    async login(credentials) {
        try {
            console.log('Connexion:', credentials.email);
            
            // Validation
            if (!credentials.email || !credentials.password) {
                throw new Error('Email et mot de passe requis');
            }

            // Vérifier dans le localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => 
                u.email === credentials.email && 
                u.password === this.hashPassword(credentials.password)
            );

            if (!user) {
                throw new Error('Email ou mot de passe incorrect');
            }

            if (!user.isActive) {
                throw new Error('Compte désactivé. Contactez le support.');
            }

            // Mettre à jour la dernière connexion
            user.lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
            
            // Sauvegarder l'utilisateur connecté
            this.currentUser = this.sanitizeUser(user);
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Mettre à jour l'UI
            this.updateUI();
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Déconnexion
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        return { success: true };
    }

    // Récupérer l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Mettre à jour le profil
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('Non connecté');
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex === -1) {
                throw new Error('Utilisateur non trouvé');
            }

            // Mettre à jour les informations
            users[userIndex] = {
                ...users[userIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Sauvegarder
            localStorage.setItem('users', JSON.stringify(users));
            
            // Mettre à jour l'utilisateur courant
            this.currentUser = this.sanitizeUser(users[userIndex]);
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.updateUI();
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Changer le mot de passe
    async changePassword(oldPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('Non connecté');
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.id === this.currentUser.id);

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier l'ancien mot de passe
            if (user.password !== this.hashPassword(oldPassword)) {
                throw new Error('Ancien mot de passe incorrect');
            }

            // Mettre à jour le mot de passe
            user.password = this.hashPassword(newPassword);
            user.updatedAt = new Date().toISOString();

            localStorage.setItem('users', JSON.stringify(users));
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Mot de passe oublié
    async forgotPassword(email) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('Aucun compte trouvé avec cet email');
            }

            // Générer un token de réinitialisation
            const resetToken = this.generateResetToken();
            user.resetToken = resetToken;
            user.resetTokenExpiry = Date.now() + 3600000; // 1 heure

            localStorage.setItem('users', JSON.stringify(users));
            
            // Envoyer l'email (simulation)
            console.log(`Lien de réinitialisation pour ${email}: /reset-password.html?token=${resetToken}`);
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Mettre à jour l'interface utilisateur
    updateUI() {
        const user = this.currentUser;
        
        // Mettre à jour la navigation
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            const authButtons = navActions.querySelector('.auth-buttons');
            if (authButtons) {
                authButtons.remove();
            }

            const newAuthButtons = document.createElement('div');
            newAuthButtons.className = 'auth-buttons';
            
            if (user) {
                // Utilisateur connecté
                newAuthButtons.innerHTML = `
                    <div class="user-menu">
                        <button class="user-btn" id="userMenuBtn">
                            <i class="fas fa-user-circle"></i>
                            <span>${user.name.split(' ')[0]}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="user-dropdown" id="userDropdown">
                            <a href="dashboard.html" class="dropdown-item">
                                <i class="fas fa-tachometer-alt"></i> Tableau de bord
                            </a>
                            <a href="orders.html" class="dropdown-item">
                                <i class="fas fa-shopping-bag"></i> Mes commandes
                            </a>
                            <a href="profile.html" class="dropdown-item">
                                <i class="fas fa-user-edit"></i> Mon profil
                            </a>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item logout-btn">
                                <i class="fas fa-sign-out-alt"></i> Déconnexion
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Utilisateur non connecté
                newAuthButtons.innerHTML = `
                    <div class="auth-links">
                        <a href="login.html" class="btn btn-outline btn-sm">Connexion</a>
                        <a href="register.html" class="btn btn-primary btn-sm">Inscription</a>
                    </div>
                `;
            }
            
            navActions.insertBefore(newAuthButtons, navActions.firstChild);
            
            // Ajouter les événements
            this.bindAuthEvents();
        }
    }

    // Lier les événements d'authentification
    bindAuthEvents() {
        // Menu utilisateur
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Fermer le dropdown en cliquant ailleurs
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });

            // Déconnexion
            const logoutBtn = document.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                    showNotification('Déconnexion réussie', 'success');
                });
            }
        }
    }

    // Fonctions utilitaires
    hashPassword(password) {
        // En production, utiliser bcrypt ou une librairie de hash
        return btoa(password); // Simple base64 pour la démo
    }

    generateResetToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    sanitizeUser(user) {
        const { password, resetToken, resetTokenExpiry, ...sanitized } = user;
        return sanitized;
    }
}

// Initialiser le système d'authentification
const auth = new AuthSystem();
