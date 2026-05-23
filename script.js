/* =========================================
   JSON BOOK DATABASE
========================================= */
const books = [
    {
        title: "Atomic Habits",
        author: "James Clear",
        purchaseDate: "12 January 2025",
        purpose: "Habit Building & Self Improvement",
        image: "images/atomic-habits.jpg"
    },
    {
        title: "The Alchemist",
        author: "Paulo Coelho",
        purchaseDate: "8 February 2025",
        purpose: "Motivation & Story Reading",
        image: "images/alchemist.jpg"
    },
    {
        title: "Deep Work",
        author: "Cal Newport",
        purchaseDate: "15 March 2025",
        purpose: "Focus & Productivity",
        image: "images/deep-work.jpg"
    },
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        purchaseDate: "20 March 2025",
        purpose: "Programming Learning",
        image: "images/clean-code.jpg"
    },
    {
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        purchaseDate: "10 April 2025",
        purpose: "Financial Knowledge",
        image: "images/rich-dad.jpg"
    }
];

/* =========================================
   DOM ELEMENTS
========================================= */
const booksGrid = document.getElementById("booksGrid");
const authorFilter = document.getElementById("authorFilter");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("bookModal");
const closeBtn = document.getElementById("closeBtn");

/* Modal Details Elements */
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalAuthor = document.getElementById("modalAuthor");
const modalDate = document.getElementById("modalDate");
const modalPurpose = document.getElementById("modalPurpose");

/* =========================================
   DISPLAY BOOKS
========================================= */
function displayBooks(bookArray) {
    booksGrid.innerHTML = "";

    // Beautiful Empty State (Matches Dark Glassmorphism Theme)
    if (bookArray.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-family: 'Playfair Display', serif; color: #f8fafc; font-size: 2rem; margin-bottom: 10px;">No Books Found</h2>
                <p style="color: #94a3b8; font-size: 1rem;">Try adjusting your search or author filter.</p>
            </div>
        `;
        return;
    }

    // Render Books
    bookArray.forEach(book => {
        // Destructuring for cleaner code
        const { title, author, image, purchaseDate, purpose } = book;

        const card = document.createElement("div");
        card.classList.add("book-card");

        // Added onerror fallback image in case local image is missing
        card.innerHTML = `
            <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';">
            <div class="book-info">
                <h3>${title}</h3>
                <p>${author}</p>
            </div>
        `;

        /* Modal Open Event */
        card.addEventListener("click", () => {
            modal.style.display = "flex";
            modalImage.src = image;
            
            // Re-apply fallback for modal image as well
            modalImage.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';
            };

            modalTitle.textContent = title;
            modalAuthor.textContent = `Author: ${author}`;
            modalDate.textContent = purchaseDate;
            modalPurpose.textContent = purpose;
        });

        booksGrid.appendChild(card);
    });
}

/* =========================================
   LOAD AUTHORS INTO DROPDOWN
========================================= */
function loadAuthors() {
    // Get unique authors using Set
    const authors = [...new Set(books.map(book => book.author))];

    authors.forEach(author => {
        const option = document.createElement("option");
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

/* =========================================
   FILTER & SEARCH LOGIC
========================================= */
function filterBooks() {
    const selectedAuthor = authorFilter.value;
    const searchText = searchInput.value.toLowerCase().trim();

    let filteredBooks = books;

    /* Filter by Author */
    if (selectedAuthor !== "all") {
        filteredBooks = filteredBooks.filter(book => book.author === selectedAuthor);
    }

    /* Filter by Search Keyword */
    if (searchText) {
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(searchText) || 
            book.author.toLowerCase().includes(searchText) // Added author search bonus!
        );
    }

    displayBooks(filteredBooks);
}

/* =========================================
   EVENT LISTENERS
========================================= */
authorFilter.addEventListener("change", filterBooks);
searchInput.addEventListener("input", filterBooks);

/* Close Modal Logic */
const closeModal = () => {
    modal.style.display = "none";
};

closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Escape key to close modal (Pro feature)
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
        closeModal();
    }
});

/* =========================================
   INITIALIZE APP
========================================= */
function initApp() {
    displayBooks(books);
    loadAuthors();
}

// Run app on load
initApp();