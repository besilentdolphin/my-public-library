'use strict';

const App = {

    /* ── STATE ─────────────────────────────────────────────────── */
    state: {
        books: [],
        filteredBooks: [],
        currentPage: 1,
        booksPerPage: 8,
        themes: ['theme-dark', 'theme-light'],
        currentThemeIndex: 0,
        favorites: JSON.parse(localStorage.getItem('library_favorites') || '[]'),
        showingFavorites: false,
        currentModalBook: null
    },

    /* ── DOM CACHE ─────────────────────────────────────────────── */
    DOM: {},

    /* ── INIT ──────────────────────────────────────────────────── */
    init() {
        this.cacheDOM();
        this.fetchBooks();
        this.bindEvents();
        this.initParticles();
        this.initCursorGlow();
        this.setupHistoryAPI();
        this.restoreTheme();
    },

    cacheDOM() {
        const q = id => document.getElementById(id);
        this.DOM = {
            grid:           q('booksGrid'),
            pagination:     q('pagination'),
            authorFilter:   q('authorFilter'),
            genreFilter:    q('genreFilter'),
            searchInput:    q('searchInput'),
            searchClear:    q('searchClear'),
            totalCount:     q('totalBooksCount'),
            showingCount:   q('showingCount'),
            themeToggle:    q('themeToggle'),
            favToggle:      q('favoritesToggle'),
            modal:          q('bookModal'),
            modalContent:   document.querySelector('.modal-content'),
            modalImage:     q('modalImage'),
            modalTitle:     q('modalTitle'),
            modalAuthor:    q('modalAuthor'),
            modalDate:      q('modalDate'),
            modalPurpose:   q('modalPurpose'),
            modalGenre:     q('modalGenre'),
            modalBadge:     q('modalBadge'),
            modalCoverGlow: q('modalCoverGlow'),
            modalFavBtn:    q('modalFavBtn'),
            closeBtn:       q('closeBtn'),
            backdrop:       document.querySelector('.modal-backdrop'),
            themeIcon:      document.querySelector('#themeToggle i')
        };
    },

    /* ── FETCH ─────────────────────────────────────────────────── */
    async fetchBooks() {
        try {
            const res = await fetch('books.json');
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();

            this.state.books = data;
            this.state.filteredBooks = [...data];

            this.DOM.totalCount.textContent = data.length;
            this.DOM.showingCount.textContent = data.length;

            this.populateFilters(data);
            this.displayBooks();
        } catch (err) {
            this.DOM.grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Could not load books. Please check <code>books.json</code>.</p>
                </div>`;
        }
    },

    /* ── FILTERS ───────────────────────────────────────────────── */
    populateFilters(data) {
        const addOptions = (selectEl, counts) => {
            Object.keys(counts).sort().forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = `${key} (${counts[key]})`;
                selectEl.appendChild(opt);
            });
        };

        const authorCounts = data.reduce((a, b) => { a[b.author] = (a[b.author] || 0) + 1; return a; }, {});
        addOptions(this.DOM.authorFilter, authorCounts);

        const genreCounts = data.reduce((a, b) => {
            if (b.genre) a[b.genre] = (a[b.genre] || 0) + 1;
            return a;
        }, {});
        addOptions(this.DOM.genreFilter, genreCounts);
    },

    filterBooks() {
        const author = this.DOM.authorFilter.value;
        const genre  = this.DOM.genreFilter.value;
        const search = this.DOM.searchInput.value.toLowerCase().trim();

        // toggle clear button
        this.DOM.searchClear.classList.toggle('visible', search.length > 0);

        let filtered = [...this.state.books];

        if (this.state.showingFavorites) {
            filtered = filtered.filter(b => this.state.favorites.includes(b.title));
        }
        if (author !== 'all') filtered = filtered.filter(b => b.author === author);
        if (genre  !== 'all') filtered = filtered.filter(b => b.genre === genre);
        if (search) filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(search) ||
            b.author.toLowerCase().includes(search)
        );

        this.state.filteredBooks = filtered;
        this.state.currentPage = 1;
        this.DOM.showingCount.textContent = filtered.length;
        this.displayBooks();
        this.pushHistory();
    },

    /* ── DISPLAY ───────────────────────────────────────────────── */
    displayBooks() {
        const { filteredBooks, currentPage, booksPerPage, favorites } = this.state;
        this.DOM.grid.innerHTML = '';

        if (filteredBooks.length === 0) {
            this.DOM.grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-book-open"></i>
                    <p>No books found. Try adjusting your filters.</p>
                </div>`;
            this.renderPagination(0);
            return;
        }

        const start   = (currentPage - 1) * booksPerPage;
        const visible = filteredBooks.slice(start, start + booksPerPage);

        const fragment = document.createDocumentFragment();

        visible.forEach((book, idx) => {
            const isFav = favorites.includes(book.title);
            const card  = document.createElement('div');
            card.classList.add('book-card');
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open details for ${book.title}`);
            card.style.animationDelay = `${idx * 50}ms`;

            card.innerHTML = `
                <div class="book-cover-container">
                    <span class="collection-badge">#${book.collectionNumber || (start + idx + 1)}</span>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-title="${this.esc(book.title)}" aria-label="${isFav ? 'Remove from' : 'Add to'} favourites">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <img src="${this.esc(book.image)}" alt="${this.esc(book.title)} cover" loading="lazy">
                </div>
                <div class="shelf" aria-hidden="true"></div>
                <div class="book-info">
                    <h3>${this.esc(book.title)}</h3>
                    <p>${this.esc(book.author)}</p>
                </div>`;

            // Fav toggle
            card.querySelector('.favorite-btn').addEventListener('click', e => {
                e.stopPropagation();
                this.toggleFavorite(book.title, e.currentTarget);
            });

            // Open modal
            const open = () => this.openModal(book);
            card.addEventListener('click', open);
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

            fragment.appendChild(card);
        });

        this.DOM.grid.appendChild(fragment);
        this.renderPagination(filteredBooks.length);
    },

    /* ── PAGINATION ────────────────────────────────────────────── */
    renderPagination(total) {
        this.DOM.pagination.innerHTML = '';
        const totalPages = Math.ceil(total / this.state.booksPerPage);
        if (totalPages <= 1) return;

        const { currentPage } = this.state;

        const makeBtn = (content, page, disabled = false, active = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = content;
            if (disabled) btn.disabled = true;
            if (active) btn.classList.add('active');
            if (!disabled) btn.addEventListener('click', () => this.changePage(page));
            return btn;
        };

        this.DOM.pagination.appendChild(makeBtn('<i class="fa-solid fa-chevron-left"></i>', currentPage - 1, currentPage === 1));

        // show up to 7 page numbers with ellipsis
        const pages = this.getPageRange(currentPage, totalPages);
        pages.forEach(p => {
            if (p === '…') {
                const span = document.createElement('span');
                span.textContent = '…';
                span.style.cssText = 'padding: 0 6px; color: var(--text-muted); font-size:0.9rem;';
                this.DOM.pagination.appendChild(span);
            } else {
                this.DOM.pagination.appendChild(makeBtn(p, p, false, p === currentPage));
            }
        });

        this.DOM.pagination.appendChild(makeBtn('<i class="fa-solid fa-chevron-right"></i>', currentPage + 1, currentPage === totalPages));
    },

    getPageRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
        if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
        return [1, '…', current - 1, current, current + 1, '…', total];
    },

    changePage(page) {
        this.state.currentPage = page;
        this.displayBooks();
        this.pushHistory();
        const top = this.DOM.grid.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
    },

    /* ── FAVOURITES ────────────────────────────────────────────── */
    toggleFavorite(title, btn) {
        let { favorites } = this.state;
        const isFav = favorites.includes(title);

        if (isFav) {
            this.state.favorites = favorites.filter(f => f !== title);
            btn.classList.remove('favorited');
            btn.setAttribute('aria-label', 'Add to favourites');
            btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        } else {
            this.state.favorites.push(title);
            btn.classList.add('favorited');
            btn.setAttribute('aria-label', 'Remove from favourites');
            btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            this.burstHeart(btn);
        }

        localStorage.setItem('library_favorites', JSON.stringify(this.state.favorites));
        if (this.state.showingFavorites) this.filterBooks();

        // sync modal fav btn if the same book is open
        if (this.state.currentModalBook?.title === title) {
            this.syncModalFavBtn(title);
        }
    },

    burstHeart(btn) {
        btn.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.5)' },
            { transform: 'scale(1)' }
        ], { duration: 350, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
    },

    /* ── MODAL ─────────────────────────────────────────────────── */
    openModal(book) {
        const { DOM } = this;
        this.state.currentModalBook = book;

        DOM.modalImage.src = book.image;
        DOM.modalImage.alt = `${book.title} cover`;
        DOM.modalTitle.textContent = book.title;
        DOM.modalAuthor.innerHTML = `<i class="fa-solid fa-pen-nib"></i> ${this.esc(book.author)}`;
        DOM.modalDate.textContent = book.purchaseDate || '—';
        DOM.modalPurpose.textContent = book.purpose || '—';
        DOM.modalGenre.textContent = book.genre || '—';
        DOM.modalBadge.textContent = `#${book.collectionNumber || ''}`;

        this.syncModalFavBtn(book.title);
        this.colorModalFromCover(book.image);

        DOM.modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        DOM.closeBtn.focus();

        history.pushState({ page: this.state.currentPage, modal: true }, '');
    },

    closeModal(fromPop = false) {
        const { DOM } = this;
        DOM.modal.classList.remove('open');
        document.body.style.overflow = '';
        DOM.modalCoverGlow.style.background = '';
        DOM.modalContent.style.boxShadow = '';
        this.state.currentModalBook = null;
        if (!fromPop) history.back();
    },

    syncModalFavBtn(title) {
        const isFav = this.state.favorites.includes(title);
        const btn = this.DOM.modalFavBtn;
        btn.classList.toggle('favorited', isFav);
        btn.innerHTML = isFav
            ? '<i class="fa-solid fa-heart"></i> Remove Favourite'
            : '<i class="fa-regular fa-heart"></i> Add to Favourites';
    },

    colorModalFromCover(src) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = () => {
            try {
                if (typeof ColorThief === 'undefined') return;
                const [r, g, b] = new ColorThief().getColor(img);
                const glow = `rgba(${r},${g},${b},0.35)`;
                this.DOM.modalCoverGlow.style.background = `radial-gradient(circle, ${glow}, transparent 70%)`;
                this.DOM.modalContent.style.boxShadow = `0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(${r},${g},${b},0.25)`;
            } catch (_) {}
        };
    },

    /* ── THEME ─────────────────────────────────────────────────── */
    restoreTheme() {
        const saved = localStorage.getItem('library_theme');
        if (saved) {
            const idx = this.state.themes.indexOf(saved);
            if (idx !== -1) {
                document.body.classList.remove(...this.state.themes);
                document.body.classList.add(saved);
                this.state.currentThemeIndex = idx;
                this.updateThemeIcon();
            }
        }
    },

    cycleTheme() {
        document.body.classList.remove(this.state.themes[this.state.currentThemeIndex]);
        this.state.currentThemeIndex = (this.state.currentThemeIndex + 1) % this.state.themes.length;
        const next = this.state.themes[this.state.currentThemeIndex];
        document.body.classList.add(next);
        localStorage.setItem('library_theme', next);
        this.updateThemeIcon();
    },

    updateThemeIcon() {
        const isDark = document.body.classList.contains('theme-dark');
        this.DOM.themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    },

    /* ── PARTICLES ─────────────────────────────────────────────── */
    initParticles() {
        if (typeof tsParticles === 'undefined') return;
        tsParticles.load('tsparticles', {
            particles: {
                number: { value: 55 },
                color: { value: ['#ffd700', '#ffffff', '#a0c4ff'] },
                opacity: { value: { min: 0.1, max: 0.7 }, animation: { enable: true, speed: 0.4 } },
                size: { value: { min: 0.8, max: 2.5 }, random: true },
                move: { enable: true, speed: 0.25, direction: 'none', random: true, outModes: 'out' },
                twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1 } }
            },
            detectRetina: true
        });
    },

    /* ── CURSOR GLOW ───────────────────────────────────────────── */
    initCursorGlow() {
        const glow = document.querySelector('.cursor-glow');
        if (!glow) return;
        let rx = 0, ry = 0;
        document.addEventListener('mousemove', e => {
            rx = e.clientX; ry = e.clientY;
            requestAnimationFrame(() => {
                glow.style.left = rx + 'px';
                glow.style.top  = ry + 'px';
            });
        });
    },

    /* ── HISTORY API ───────────────────────────────────────────── */
    setupHistoryAPI() {
        history.replaceState({ page: 1, modal: false }, '');
        window.addEventListener('popstate', e => {
            if (this.DOM.modal.classList.contains('open')) {
                this.closeModal(true);
            } else if (e.state?.page) {
                this.state.currentPage = e.state.page;
                this.displayBooks();
            }
        });
    },

    pushHistory() {
        history.pushState({ page: this.state.currentPage, modal: false }, '');
    },

    /* ── EVENTS ────────────────────────────────────────────────── */
    bindEvents() {
        const { DOM } = this;

        DOM.authorFilter.addEventListener('change', () => this.filterBooks());
        DOM.genreFilter.addEventListener('change',  () => this.filterBooks());
        DOM.searchInput.addEventListener('input',   () => this.filterBooks());

        DOM.searchClear.addEventListener('click', () => {
            DOM.searchInput.value = '';
            this.filterBooks();
            DOM.searchInput.focus();
        });

        DOM.themeToggle.addEventListener('click', () => this.cycleTheme());

        DOM.favToggle.addEventListener('click', () => {
            this.state.showingFavorites = !this.state.showingFavorites;
            DOM.favToggle.classList.toggle('active', this.state.showingFavorites);
            this.filterBooks();
        });

        DOM.closeBtn.addEventListener('click',   () => this.closeModal());
        DOM.backdrop.addEventListener('click',   () => this.closeModal());

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.DOM.modal.classList.contains('open')) {
                this.closeModal();
            }
        });

        DOM.modalFavBtn.addEventListener('click', () => {
            const book = this.state.currentModalBook;
            if (!book) return;
            this.toggleFavorite(book.title, DOM.modalFavBtn);
        });
    },

    /* ── UTILITY ───────────────────────────────────────────────── */
    esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());