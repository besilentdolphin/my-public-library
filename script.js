const App = {
    state: {
        books: [],
        filteredBooks: [],
        currentPage: 1,
        booksPerPage: 8, // ১০টি বই প্রতি পেজে (আপনি চাইলে পরিবর্তন করতে পারেন)
        themes: ["theme-starry", "theme-light"],
        currentThemeIndex: 0,
        favorites: JSON.parse(localStorage.getItem('library_favorites')) || [],
        showingFavorites: false
    },

    DOM: {
        booksGrid: document.getElementById("booksGrid"),
        pagination: document.getElementById("pagination"),
        authorFilter: document.getElementById("authorFilter"),
        genreFilter: document.getElementById("genreFilter"),
        searchInput: document.getElementById("searchInput"),
        totalCount: document.getElementById("totalBooksCount"),
        themeToggle: document.getElementById("themeToggle"),
        favToggle: document.getElementById("favoritesToggle"),
        
        modal: document.getElementById("bookModal"),
        modalContent: document.querySelector(".modal-content"),
        modalImage: document.getElementById("modalImage"),
        modalTitle: document.getElementById("modalTitle"),
        modalAuthor: document.getElementById("modalAuthor"),
        modalDate: document.getElementById("modalDate"),
        modalPurpose: document.getElementById("modalPurpose"),
        closeBtn: document.getElementById("closeBtn")
    },

    init() {
        this.fetchBooks();
        this.setupEventListeners();
        this.initParticles();
        this.setupHistoryAPI();
        this.startTitleSparkles(); // টাইটেল চিকচিক করার ফাংশন
    },

    async fetchBooks() {
        try {
            const response = await fetch("books.json");
            if (!response.ok) throw new Error("Failed to load");
            const data = await response.json();
            
            this.state.books = data;
            this.state.filteredBooks = [...data];
            this.DOM.totalCount.textContent = data.length;

            this.loadFilters(data);
            this.displayBooks();
        } catch (error) {
            this.DOM.booksGrid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: red;">Failed to load books.</p>`;
        }
    },

    loadFilters(data) {
        const authorCounts = data.reduce((acc, book) => {
            acc[book.author] = (acc[book.author] || 0) + 1;
            return acc;
        }, {});
        
        Object.keys(authorCounts).sort().forEach(author => {
            const option = document.createElement("option");
            option.value = author;
            option.textContent = `${author} (${authorCounts[author]})`;
            this.DOM.authorFilter.appendChild(option);
        });

        const genreCounts = data.reduce((acc, book) => {
            if(book.genre) {
                acc[book.genre] = (acc[book.genre] || 0) + 1;
            }
            return acc;
        }, {});

        Object.keys(genreCounts).sort().forEach(genre => {
            const option = document.createElement("option");
            option.value = genre;
            option.textContent = `${genre} (${genreCounts[genre]})`;
            this.DOM.genreFilter.appendChild(option);
        });
    },

    displayBooks() {
        const { filteredBooks, currentPage, booksPerPage, favorites } = this.state;
        this.DOM.booksGrid.innerHTML = "";

        if (filteredBooks.length === 0) {
            this.DOM.booksGrid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No books found.</p>`;
            this.renderPagination(0);
            return;
        }

        const startIndex = (currentPage - 1) * booksPerPage;
        const paginatedBooks = filteredBooks.slice(startIndex, startIndex + booksPerPage);

        paginatedBooks.forEach(book => {
            const isFav = favorites.includes(book.title);
            const card = document.createElement("div");
            card.classList.add("book-card");
            
            // 💡 এখানেই আসল পরিবর্তনটি করা হয়েছে ( <div class="shelf"></div> যুক্ত করা হয়েছে )
            card.innerHTML = `
                <div class="book-cover-container">
                    <div class="collection-badge">#${book.collectionNumber}</div>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-title="${book.title}" aria-label="Favorite">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <img src="${book.image}" alt="${book.title}" loading="lazy">
                </div>
                
                <!-- The Magical 3D Shelf -->
                <div class="shelf"></div>
                
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                </div>
            `;

            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleFavorite(book.title, favBtn);
            });

            card.addEventListener("click", () => this.openModal(book));
            this.DOM.booksGrid.appendChild(card);
        });

        this.renderPagination(filteredBooks.length);
    },

    toggleFavorite(title, btnElement) {
        let { favorites } = this.state;
        if (favorites.includes(title)) {
            favorites = favorites.filter(fav => fav !== title);
            btnElement.classList.remove('favorited');
            btnElement.innerHTML = '<i class="fa-regular fa-heart"></i>';
        } else {
            favorites.push(title);
            btnElement.classList.add('favorited');
            btnElement.innerHTML = '<i class="fa-solid fa-heart"></i>';
        }
        this.state.favorites = favorites;
        localStorage.setItem('library_favorites', JSON.stringify(favorites));

        if (this.state.showingFavorites) this.filterBooks();
    },

    filterBooks() {
        const author = this.DOM.authorFilter.value;
        const genre = this.DOM.genreFilter.value;
        const search = this.DOM.searchInput.value.toLowerCase().trim();

        let filtered = [...this.state.books];

        if (this.state.showingFavorites) {
            filtered = filtered.filter(book => this.state.favorites.includes(book.title));
        }
        if (author !== "all") filtered = filtered.filter(book => book.author === author);
        if (genre !== "all") filtered = filtered.filter(book => book.genre === genre);
        if (search) filtered = filtered.filter(book => 
            book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search)
        );

        this.state.filteredBooks = filtered;
        this.state.currentPage = 1;
        this.displayBooks();
        this.updateHistoryState();
    },

    renderPagination(totalItems) {
        this.DOM.pagination.innerHTML = "";
        const totalPages = Math.ceil(totalItems / this.state.booksPerPage);
        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left"></i> Prev`;
        prevBtn.disabled = this.state.currentPage === 1;
        prevBtn.addEventListener("click", () => this.changePage(this.state.currentPage - 1));
        this.DOM.pagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            if (i === this.state.currentPage) btn.classList.add("active");
            btn.addEventListener("click", () => this.changePage(i));
            this.DOM.pagination.appendChild(btn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = `Next <i class="fa-solid fa-chevron-right"></i>`;
        nextBtn.disabled = this.state.currentPage === totalPages;
        nextBtn.addEventListener("click", () => this.changePage(this.state.currentPage + 1));
        this.DOM.pagination.appendChild(nextBtn);
    },

    changePage(newPage) {
        this.state.currentPage = newPage;
        this.displayBooks();
        this.updateHistoryState();
        window.scrollTo({ top: this.DOM.booksGrid.offsetTop - 50, behavior: "smooth" });
    },

    setupHistoryAPI() {
        history.replaceState({ page: 1, modalOpen: false }, "");

        window.addEventListener('popstate', (e) => {
            if (this.DOM.modal.style.display === "flex") {
                this.closeModal(true);
            } else if (e.state && e.state.page) {
                this.state.currentPage = e.state.page;
                this.displayBooks();
            }
        });
    },

    updateHistoryState() {
        history.pushState({ page: this.state.currentPage, modalOpen: false }, "");
    },

    openModal(book) {
        this.DOM.modalImage.src = book.image;
        this.DOM.modalTitle.textContent = book.title;
        this.DOM.modalAuthor.innerHTML = `<i class="fa-solid fa-pen-nib"></i> ${book.author}`;
        this.DOM.modalDate.textContent = book.purchaseDate || "Unknown";
        this.DOM.modalPurpose.textContent = book.purpose || "N/A";
        
        this.DOM.modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        
        history.pushState({ page: this.state.currentPage, modalOpen: true }, "");
        this.dynamicModalColor(book.image);
    },

    closeModal(fromPopState = false) {
        this.DOM.modal.style.display = "none";
        document.body.style.overflow = "auto";
        this.DOM.modalContent.style.boxShadow = "0 20px 50px rgba(0,0,0,.8)";
        
        if (!fromPopState) {
            history.back();
        }
    },

    dynamicModalColor(imageSrc) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        img.onload = () => {
            try {
                const color = new ColorThief().getColor(img);
                if (color) this.DOM.modalContent.style.boxShadow = `0 0 50px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`;
            } catch (e) { }
        };
    },

    startTitleSparkles() {
        const titleElement = document.getElementById("mainTitle");
        if (!titleElement) return;

        setInterval(() => {
            const star = document.createElement("i");
            star.className = "fa-solid fa-star title-star-sparkle";
            
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            star.style.top = `${top}%`;
            star.style.left = `${left}%`;
            
            const size = Math.random() * 10 + 8;
            star.style.fontSize = `${size}px`;
            
            titleElement.appendChild(star);
            
            setTimeout(() => {
                star.remove();
            }, 1200);
        }, 400); 
    },

    setupEventListeners() {
        this.DOM.authorFilter.addEventListener("change", () => this.filterBooks());
        this.DOM.genreFilter.addEventListener("change", () => this.filterBooks());
        this.DOM.searchInput.addEventListener("input", () => this.filterBooks());

        this.DOM.closeBtn.addEventListener("click", () => this.closeModal());
        this.DOM.modal.addEventListener("click", (e) => {
            if (e.target === this.DOM.modal) this.closeModal();
        });

        this.DOM.themeToggle.addEventListener("click", () => {
            document.body.classList.remove(this.state.themes[this.state.currentThemeIndex]);
            this.state.currentThemeIndex = (this.state.currentThemeIndex + 1) % this.state.themes.length;
            document.body.classList.add(this.state.themes[this.state.currentThemeIndex]);
        });

        this.DOM.favToggle.addEventListener("click", () => {
            this.state.showingFavorites = !this.state.showingFavorites;
            this.DOM.favToggle.classList.toggle("active", this.state.showingFavorites);
            this.filterBooks();
        });

        document.addEventListener("mousemove", (e) => {
            requestAnimationFrame(() => {
                const glow = document.querySelector('.cursor-glow');
                if(glow) {
                    glow.style.left = `${e.clientX}px`;
                    glow.style.top = `${e.clientY}px`;
                }
            });
        });
    },

    initParticles() {
        if (typeof tsParticles !== 'undefined') {
            tsParticles.load("tsparticles", {
                particles: {
                    number: { value: 60 },
                    color: { value: "#ffd700" }, 
                    opacity: { value: 0.6 },
                    size: { value: 2, random: true },
                    move: { enable: true, speed: 0.3, direction: "none", random: true, out_mode: "out" }
                }
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => App.init());