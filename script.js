/* =========================================
   STATE & DOM ELEMENTS
========================================= */
let books = []; // We will load the data into this array from JSON

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
   FETCH DATA FROM JSON
========================================= */
async function fetchBooks() {
    try {
        const response = await fetch("books.json");
        books = await response.json();
        initApp(); // Initialize after data is loaded
    } catch (error) {
        console.error("Error loading books.json:", error);
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
                <h2>Error loading data!</h2>
                <p>Please make sure you are running this on a Local Server (like VS Code Live Server).</p>
            </div>
        `;
    }
}

/* =========================================
   DISPLAY BOOKS
========================================= */
function displayBooks(bookArray) {
    booksGrid.innerHTML = "";

    if (bookArray.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-family: 'Playfair Display', serif; color: #f8fafc; font-size: 2rem; margin-bottom: 10px;">No Books Found</h2>
                <p style="color: #94a3b8; font-size: 1rem;">Try adjusting your search or author filter.</p>
            </div>
        `;
        return;
    }

    bookArray.forEach(book => {
        const { collectionNumber, title, author, image, purchaseDate, purpose } = book;

        const card = document.createElement("div");
        card.classList.add("book-card");

        card.innerHTML = `
            <div class="collection-badge">#${collectionNumber}</div>
            <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';">
            <div class="book-info">
                <h3>${title}</h3>
                <p>${author}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            modal.style.display = "flex";
            modalImage.src = image;
            
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
   LOAD AUTHORS & FILTERS
========================================= */
function loadAuthors() {
    const authors = [...new Set(books.map(book => book.author))];
    authors.forEach(author => {
        const option = document.createElement("option");
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

function filterBooks() {
    const selectedAuthor = authorFilter.value;
    const searchText = searchInput.value.toLowerCase().trim();

    let filteredBooks = books;

    if (selectedAuthor !== "all") {
        filteredBooks = filteredBooks.filter(book => book.author === selectedAuthor);
    }

    if (searchText) {
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(searchText) || 
            book.author.toLowerCase().includes(searchText)
        );
    }

    displayBooks(filteredBooks);
}

/* =========================================
   EVENT LISTENERS
========================================= */
authorFilter.addEventListener("change", filterBooks);
searchInput.addEventListener("input", filterBooks);

const closeModal = () => {
    modal.style.display = "none";
};

closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

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

// Start the process
fetchBooks();