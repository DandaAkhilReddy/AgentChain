/**
 * AgentChains.ai - Main JavaScript
 * Advanced interactions and animations
 * Built with 40+ years of development expertise
 */

// ================================
// UTILITIES & HELPERS
// ================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

const lerp = (start, end, factor) => start + (end - start) * factor;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// ================================
// LOADING ANIMATION
// ================================

class LoadingScreen {
    constructor() {
        this.loadingElement = $('#loading');
        this.progressBar = $('.progress-bar');
        this.loadingText = $('.loading-text');
        this.isLoaded = false;
        
        this.messages = [
            'Initializing AI Agents...',
            'Connecting to Blockchain...',
            'Loading Neural Networks...',
            'Preparing Interface...',
            'Almost Ready...'
        ];
        
        this.init();
    }
    
    init() {
        let progress = 0;
        let messageIndex = 0;
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            
            if (progress >= 100) {
                progress = 100;
                this.complete();
                clearInterval(loadingInterval);
            }
            
            // Update message every 25% progress
            const newMessageIndex = Math.floor((progress / 100) * this.messages.length);
            if (newMessageIndex !== messageIndex && newMessageIndex < this.messages.length) {
                messageIndex = newMessageIndex;
                this.loadingText.textContent = this.messages[messageIndex];
            }
        }, 200);
    }
    
    complete() {
        setTimeout(() => {
            this.loadingElement.classList.add('hide');
            this.isLoaded = true;
            document.body.classList.add('loaded');
            
            // Trigger page animations
            this.initPageAnimations();
        }, 500);
    }
    
    initPageAnimations() {
        // Animate hero section
        gsap.fromTo('.hero-content', 
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
        );
        
        gsap.fromTo('.hero-visual', 
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.7)', delay: 0.3 }
        );
    }
}

// ================================
// NAVIGATION
// ================================

class Navigation {
    constructor() {
        this.navbar = $('#navbar');
        this.hamburger = $('#hamburger');
        this.navMenu = $('#nav-menu');
        this.navLinks = $$('.nav-link');
        this.isMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateActiveLink();
    }
    
    bindEvents() {
        // Scroll effects
        window.addEventListener('scroll', throttle(this.handleScroll.bind(this), 16));
        
        // Mobile menu toggle
        this.hamburger?.addEventListener('click', this.toggleMobileMenu.bind(this));
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navbar.contains(e.target) && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        // Smooth scroll for nav links
        this.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });
        
        // Update active link on scroll
        window.addEventListener('scroll', throttle(this.updateActiveLink.bind(this), 100));
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Add scrolled class to navbar
        if (scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }
    
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.navMenu.classList.toggle('active');
        
        // Animate hamburger
        const bars = $$('.bar');
        if (this.isMenuOpen) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    }
    
    closeMobileMenu() {
        this.isMenuOpen = false;
        this.navMenu.classList.remove('active');
        
        const bars = $$('.bar');
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    }
    
    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = $(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        
        // Close mobile menu if open
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    updateActiveLink() {
        const sections = $$('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = $(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                // Remove active class from all links
                this.navLinks.forEach(link => link.classList.remove('active'));
                // Add active class to current link
                navLink?.classList.add('active');
            }
        });
    }
}

// ================================
// ANIMATED COUNTERS
// ================================

class AnimatedCounters {
    constructor() {
        this.counters = $$('[data-target]');
        this.hasAnimated = new Set();
        this.init();
    }
    
    init() {
        this.observeCounters();
    }
    
    observeCounters() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated.has(entry.target)) {
                    this.animateCounter(entry.target);
                    this.hasAnimated.add(entry.target);
                }
            });
        }, { threshold: 0.8 });
        
        this.counters.forEach(counter => {
            observer.observe(counter);
        });
    }
    
    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            // Format number with commas
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// ================================
// PARTICLE SYSTEM
// ================================

class ParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.bindEvents();
        this.createParticles();
        this.animate();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.3';
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }
    
    bindEvents() {
        window.addEventListener('resize', this.resize.bind(this));
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }
    
    createParticles() {
        const particleCount = Math.min(100, window.innerWidth / 10);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.y > window.innerHeight) particle.y = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            
            // Mouse interaction
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += dx * force * 0.001;
                particle.vy += dy * force * 0.001;
            }
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
            
            // Draw connections
            this.particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.globalAlpha = (150 - distance) / 150 * 0.2;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            });
        });
        
        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
}

// ================================
// 3D TILT EFFECTS
// ================================

class TiltEffect {
    constructor() {
        this.tiltElements = $$('[data-tilt]');
        this.init();
    }
    
    init() {
        this.tiltElements.forEach(element => {
            this.bindTiltEvents(element);
        });
    }
    
    bindTiltEvents(element) {
        element.addEventListener('mouseenter', () => {
            element.style.transition = 'none';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            const rotateX = clamp(deltaY / rect.height * -30, -15, 15);
            const rotateY = clamp(deltaX / rect.width * 30, -15, 15);
            
            const scale = 1.05;
            const translateZ = 20;
            
            element.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                scale(${scale}) 
                translateZ(${translateZ}px)
            `;
        });
    }
}

// ================================
// SCROLL ANIMATIONS
// ================================

class ScrollAnimations {
    constructor() {
        this.animatedElements = $$('[data-animate]');
        this.init();
    }
    
    init() {
        this.observeElements();
    }
    
    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.getAttribute('data-animate');
                    this.animateElement(element, animationType);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        this.animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    animateElement(element, animationType) {
        switch (animationType) {
            case 'fadeInUp':
                gsap.fromTo(element, 
                    { opacity: 0, y: 50 },
                    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
                );
                break;
            case 'fadeInLeft':
                gsap.fromTo(element, 
                    { opacity: 0, x: -50 },
                    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
                );
                break;
            case 'fadeInRight':
                gsap.fromTo(element, 
                    { opacity: 0, x: 50 },
                    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
                );
                break;
            case 'scaleIn':
                gsap.fromTo(element, 
                    { opacity: 0, scale: 0.5 },
                    { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }
                );
                break;
            default:
                gsap.fromTo(element, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.8 }
                );
        }
    }
}

// ================================
// SMOOTH SCROLLING
// ================================

class SmoothScroll {
    constructor() {
        this.current = 0;
        this.target = 0;
        this.ease = 0.1;
        this.init();
    }
    
    init() {
        document.body.style.height = `${document.body.scrollHeight}px`;
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100%';
        
        this.bindEvents();
        this.animate();
    }
    
    bindEvents() {
        window.addEventListener('wheel', this.handleWheel.bind(this));
        window.addEventListener('resize', debounce(this.handleResize.bind(this), 250));
    }
    
    handleWheel(e) {
        this.target += e.deltaY * 0.5;
        this.target = clamp(this.target, 0, document.body.scrollHeight - window.innerHeight);
    }
    
    handleResize() {
        document.body.style.height = `${document.body.scrollHeight}px`;
    }
    
    animate() {
        this.current = lerp(this.current, this.target, this.ease);
        document.body.style.transform = `translateY(-${this.current}px)`;
        
        // Update scroll position for other scripts
        window.scrollY = this.current;
        
        requestAnimationFrame(() => this.animate());
    }
}

// ================================
// AUDIO SYSTEM
// ================================

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.isEnabled = false;
        this.init();
    }
    
    init() {
        // Initialize audio context on first user interaction
        document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isEnabled = true;
            this.loadSounds();
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }
    
    loadSounds() {
        const soundUrls = {
            hover: 'data:audio/wav;base64,UklGRn...',  // Base64 encoded hover sound
            click: 'data:audio/wav;base64,UklGRn...',  // Base64 encoded click sound
        };
        
        // This would load actual sound files in production
        // For now, we'll create simple synthetic sounds
        this.createSyntheticSounds();
    }
    
    createSyntheticSounds() {
        // Create hover sound (short beep)
        this.sounds.set('hover', () => {
            if (!this.isEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        });
        
        // Create click sound (short click)
        this.sounds.set('click', () => {
            if (!this.isEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        });
    }
    
    play(soundName) {
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound();
        }
    }
    
    bindToElements() {
        // Add hover sounds to interactive elements
        $$('button, .btn, .nav-link').forEach(element => {
            element.addEventListener('mouseenter', () => this.play('hover'));
            element.addEventListener('click', () => this.play('click'));
        });
    }
}

// ================================
// THEME MANAGER
// ================================

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }
    
    init() {
        this.loadTheme();
        this.bindEvents();
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('agentchains-theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.body.setAttribute('data-theme', this.currentTheme);
        }
    }
    
    bindEvents() {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }
    
    handleSystemThemeChange(e) {
        if (!localStorage.getItem('agentchains-theme')) {
            this.currentTheme = e.matches ? 'dark' : 'light';
            document.body.setAttribute('data-theme', this.currentTheme);
        }
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('agentchains-theme', this.currentTheme);
    }
}

// ================================
// PERFORMANCE MONITOR
// ================================

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            memory: 0,
            loadTime: 0
        };
        
        this.init();
    }
    
    init() {
        this.measureLoadTime();
        this.startFPSMonitoring();
        this.monitorMemory();
    }
    
    measureLoadTime() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            console.log(`🚀 Page loaded in ${this.metrics.loadTime.toFixed(2)}ms`);
        });
    }
    
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = (currentTime) => {
            frames++;
            
            if (currentTime - lastTime >= 1000) {
                this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    monitorMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
            }, 5000);
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
}

// ================================
// ACCESSIBILITY ENHANCEMENTS
// ================================

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }
    
    init() {
        this.enhanceKeyboardNavigation();
        this.addScreenReaderSupport();
        this.handleMotionPreferences();
    }
    
    enhanceKeyboardNavigation() {
        // Add visible focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link sr-only';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    addScreenReaderSupport() {
        // Add ARIA labels to interactive elements
        $$('button:not([aria-label])').forEach(button => {
            if (!button.textContent.trim()) {
                button.setAttribute('aria-label', 'Button');
            }
        });
        
        // Announce page changes
        this.announcePageChanges();
    }
    
    announcePageChanges() {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
        
        // Announce section changes
        window.addEventListener('scroll', throttle(() => {
            const currentSection = this.getCurrentSection();
            if (currentSection) {
                announcer.textContent = `Now viewing: ${currentSection}`;
            }
        }, 1000));
    }
    
    getCurrentSection() {
        const sections = $$('section[id]');
        const scrollPos = window.scrollY + 100;
        
        for (const section of sections) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                return section.querySelector('h1, h2, h3')?.textContent || section.id;
            }
        }
        
        return null;
    }
    
    handleMotionPreferences() {
        // Respect user's motion preferences
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (mediaQuery.matches) {
            document.body.classList.add('reduced-motion');
        }
        
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function scrollToSection(sectionId) {
    const section = $(`#${sectionId}`);
    if (section) {
        const offsetTop = section.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
    }
}

// ================================
// CONTACT FORM HANDLER
// ================================

class ContactForm {
    constructor() {
        this.form = $('#contactForm');
        this.submitButton = $('.form-submit-btn');
        this.statusElement = $('#formStatus');
        this.init();
    }
    
    init() {
        if (this.form) {
            this.bindEvents();
            this.setupValidation();
        }
    }
    
    bindEvents() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
            input.addEventListener('input', this.clearFieldError.bind(this));
        });
    }
    
    setupValidation() {
        // Custom validation messages
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('invalid', this.handleInvalid.bind(this));
        });
    }
    
    handleInvalid(e) {
        e.preventDefault();
        const field = e.target;
        const fieldType = field.type || field.tagName.toLowerCase();
        
        let message = 'This field is required.';
        
        if (fieldType === 'email') {
            message = 'Please enter a valid email address.';
        } else if (field.name === 'firstName' || field.name === 'lastName') {
            message = 'Please enter your name.';
        } else if (field.name === 'message') {
            message = 'Please tell us how we can help you.';
        } else if (field.name === 'subject') {
            message = 'Please select a topic.';
        } else if (field.name === 'terms') {
            message = 'You must agree to the terms and conditions.';
        }
        
        this.showFieldError(field, message);
    }
    
    validateField(e) {
        const field = e.target;
        this.clearFieldError(field);
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(field, 'This field is required.');
            return false;
        }
        
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                this.showFieldError(field, 'Please enter a valid email address.');
                return false;
            }
        }
        
        return true;
    }
    
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = '#FF4757';
        field.style.boxShadow = '0 0 15px rgba(255, 71, 87, 0.3)';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#FF4757';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '0.5rem';
        errorElement.style.animation = 'fadeIn 0.3s';
        
        field.parentNode.appendChild(errorElement);
    }
    
    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        
        field.style.borderColor = '';
        field.style.boxShadow = '';
    }
    
    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField({ target: field })) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showStatus('Please correct the errors above.', 'error');
            return;
        }
        
        this.setLoading(true);
        this.hideStatus();
        
        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Simulate form submission (replace with actual endpoint)
            const response = await this.submitForm(data);
            
            if (response.success) {
                this.showStatus('🎉 Thank you! Your message has been sent. We\'ll get back to you within 24 hours.', 'success');
                this.form.reset();
                
                // Track successful submission
                this.trackFormSubmission(data.subject);
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showStatus('❌ Sorry, there was an error sending your message. Please try again or email us directly at info@agentchains.ai', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async submitForm(data) {
        // Simulate API call - replace with your actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                // For demo purposes, always return success
                // In production, this would be an actual API call
                resolve({
                    success: true,
                    message: 'Form submitted successfully'
                });
            }, 2000);
        });
        
        /* 
        // Example real implementation:
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        */
    }
    
    setLoading(loading) {
        if (loading) {
            this.submitButton.classList.add('loading');
            this.submitButton.disabled = true;
        } else {
            this.submitButton.classList.remove('loading');
            this.submitButton.disabled = false;
        }
    }
    
    showStatus(message, type) {
        this.statusElement.textContent = message;
        this.statusElement.className = `form-status ${type} show`;
    }
    
    hideStatus() {
        this.statusElement.classList.remove('show');
    }
    
    trackFormSubmission(subject) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                event_category: 'Contact',
                event_label: subject,
                value: 1
            });
        }
        
        console.log('📧 Contact form submitted:', { subject, timestamp: new Date().toISOString() });
    }
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    const loadingScreen = new LoadingScreen();
    const navigation = new Navigation();
    const animatedCounters = new AnimatedCounters();
    const particleSystem = new ParticleSystem();
    const tiltEffect = new TiltEffect();
    const scrollAnimations = new ScrollAnimations();
    const audioSystem = new AudioSystem();
    const themeManager = new ThemeManager();
    const performanceMonitor = new PerformanceMonitor();
    const accessibilityEnhancer = new AccessibilityEnhancer();
    const contactForm = new ContactForm();
    
    // Optional smooth scrolling (can be resource intensive)
    const enableSmoothScroll = false;
    if (enableSmoothScroll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const smoothScroll = new SmoothScroll();
    }
    
    // Bind audio to elements after initialization
    setTimeout(() => {
        audioSystem.bindToElements();
    }, 1000);
    
    // Global utilities
    window.AgentChains = {
        scrollToSection,
        formatNumber,
        copyToClipboard,
        getPerformanceMetrics: () => performanceMonitor.getMetrics(),
        toggleTheme: () => themeManager.toggleTheme()
    };
    
    console.log('🔗 AgentChains.ai initialized successfully');
    console.log('🎯 Performance metrics available via window.AgentChains.getPerformanceMetrics()');
});

// ================================
// ERROR HANDLING
// ================================

window.addEventListener('error', (e) => {
    console.error('AgentChains Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('AgentChains Unhandled Promise Rejection:', e.reason);
    // In production, you might want to send this to an error tracking service
});

// ================================
// SERVICE WORKER REGISTRATION
// ================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('🔧 Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}