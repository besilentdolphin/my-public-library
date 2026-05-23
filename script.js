/* =========================================
   STATE & DOM ELEMENTS
========================================= */
let books = []; 
let currentFilteredBooks = []; // To store searched/filtered results
let currentPage = 1;
const booksPerPage = 8; // Number of books per page

const booksGrid = document.getElementById("booksGrid");
const paginationContainer = document.getElementById("pagination");
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
        currentFilteredBooks = books; // Initially all books are filtered books
        initApp(); 
    } catch (error) {
        console.error("Error loading books.json:", error);
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
                <h2>Error loading data!</h2>
                <p>Please make sure you are running this on a Local Server.</p>
            </div>
        `;
    }
}

/* =========================================
   DISPLAY BOOKS WITH PAGINATION
========================================= */
function displayBooks(bookArray) {
    booksGrid.innerHTML = "";

    // 1. Handle Empty State
    if (bookArray.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-family: 'Playfair Display', serif; color: #f8fafc; font-size: 2rem; margin-bottom: 10px;">No Books Found</h2>
                <p style="color: #94a3b8; font-size: 1rem;">Try adjusting your search or author filter.</p>
            </div>
        `;
        paginationContainer.innerHTML = ""; // Clear pagination
        return;
    }

    // 2. Pagination Math (Slice the array for the current page)
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const paginatedBooks = bookArray.slice(startIndex, endIndex);

    // 3. Render only the books for this page
    paginatedBooks.forEach(book => {
        const { collectionNumber, title, author, image, purchaseDate, purpose } = book;

        const card = document.createElement("div");
        card.classList.add("book-card");

        card.innerHTML = `
            <div class="book-cover-container">
                <div class="collection-badge">#${collectionNumber}</div>
                <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';">
                <div class="shelf"></div>
            </div>
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

    // 4. Render Pagination Buttons
    renderPagination(bookArray.length);
}

/* =========================================
   RENDER PAGINATION CONTROLS
========================================= */
function renderPagination(totalItems) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / booksPerPage);

    if (totalPages <= 1) return; // Hide pagination if there is only 1 page

    // Previous Button
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&laquo; Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayBooks(currentFilteredBooks);
            scrollToTop();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Numbered Buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.classList.add("active");
        
        pageBtn.addEventListener("click", () => {
            currentPage = i;
            displayBooks(currentFilteredBooks);
            scrollToTop();
        });
        
        paginationContainer.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Next &raquo;";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayBooks(currentFilteredBooks);
            scrollToTop();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Smooth scroll to top of the grid when page changes
function scrollToTop() {
    window.scrollTo({
        top: document.querySelector('.controls').offsetTop - 20,
        behavior: 'smooth'
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

    currentFilteredBooks = books;

    if (selectedAuthor !== "all") {
        currentFilteredBooks = currentFilteredBooks.filter(book => book.author === selectedAuthor);
    }

    if (searchText) {
        currentFilteredBooks = currentFilteredBooks.filter(book => 
            book.title.toLowerCase().includes(searchText) || 
            book.author.toLowerCase().includes(searchText)
        );
    }

    currentPage = 1; // Reset to page 1 whenever searching or filtering
    displayBooks(currentFilteredBooks);
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
    displayBooks(currentFilteredBooks);
    loadAuthors();
}

// Start the process
fetchBooks();