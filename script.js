/* =========================================
   STATE & DOM ELEMENTS
========================================= */
let books = []; 
let currentFilteredBooks = []; 
let currentPage = 1;
const booksPerPage = 8; 

const booksGrid = document.getElementById("booksGrid");
const paginationContainer = document.getElementById("pagination");
const authorFilter = document.getElementById("authorFilter");
const searchInput = document.getElementById("searchInput");
const totalBooksCount = document.getElementById("totalBooksCount");

const modal = document.getElementById("bookModal");
const closeBtn = document.getElementById("closeBtn");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalAuthor = document.getElementById("modalAuthor");
const modalDate = document.getElementById("modalDate");
const modalPurpose = document.getElementById("modalPurpose");


/* =========================================
   URL HISTORY MANAGEMENT (BACK BUTTON FIX)
========================================= */
// ব্রাউজারের লিংক থেকে বর্তমান পেইজ নাম্বার বের করা
function getPageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page'));
    return page ? page : 1;
}

// পেইজ বদলালে ব্রাউজারের লিংকে পেইজ নাম্বার যুক্ত করা
function updateURL(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.pushState({ page: page }, '', url);
}

// ব্রাউজারের Back বা Forward বাটন চাপলে কী হবে
window.addEventListener('popstate', (event) => {
    // ১. যদি বইয়ের পপ-আপ (মডাল) ওপেন থাকে, তবে ব্যাক বাটন চাপলে শুধু পপ-আপটি বন্ধ হবে
    if (modal.style.display === "flex") {
        modal.style.display = "none";
    }

    // ২. পেইজ নাম্বার ঠিক করা
    let newPage = event.state && event.state.page ? event.state.page : getPageFromURL();
    
    // ৩. যদি পেইজ নাম্বার আসলেই পরিবর্তন হয়, তবেই নতুন করে বইগুলো শো করাবে
    if (newPage !== currentPage) {
        currentPage = newPage;
        displayBooks(currentFilteredBooks);
    }
});


/* =========================================
   FETCH DATA FROM JSON
========================================= */
async function fetchBooks() {
    try {
        const response = await fetch("books.json");
        books = await response.json();
        currentFilteredBooks = books; 
        
        if (totalBooksCount) {
            totalBooksCount.textContent = books.length;
        }

        currentPage = getPageFromURL(); 
        
        // প্রথমবার সাইটে ঢুকলে হিস্ট্রি সেট করা
        window.history.replaceState({ page: currentPage }, '', window.location.href);
        
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

    if (bookArray.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-family: 'Playfair Display', serif; color: #f8fafc; font-size: 2rem; margin-bottom: 10px;">No Books Found</h2>
                <p style="color: #94a3b8; font-size: 1rem;">Try adjusting your search or author filter.</p>
            </div>
        `;
        paginationContainer.innerHTML = ""; 
        return;
    }

    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const paginatedBooks = bookArray.slice(startIndex, endIndex);

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

        // মডাল (পপ-আপ) ওপেন করার লজিক
        card.addEventListener("click", () => {
            // পপ-আপ ওপেন করার সময় ব্রাউজারের হিস্ট্রিতে একটি ফেক স্টেট পাঠানো হচ্ছে
            window.history.pushState({ page: currentPage, modal: true }, '', window.location.href);
            
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

    renderPagination(bookArray.length);
}


/* =========================================
   RENDER PAGINATION CONTROLS
========================================= */
function renderPagination(totalItems) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / booksPerPage);

    if (totalPages <= 1) return; 

    // Prev Button
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&laquo; Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updateURL(currentPage); 
            displayBooks(currentFilteredBooks);
            scrollToTop();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.classList.add("active");
        
        pageBtn.addEventListener("click", () => {
            currentPage = i;
            updateURL(currentPage); 
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
            updateURL(currentPage); 
            displayBooks(currentFilteredBooks);
            scrollToTop();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

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
    const authorCounts = {};
    books.forEach(book => {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    });

    const authors = Object.keys(authorCounts).sort();

    authors.forEach(author => {
        const option = document.createElement("option");
        option.value = author;
        option.textContent = `${author} (${authorCounts[author]})`;
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

    currentPage = 1; 
    updateURL(currentPage); 
    displayBooks(currentFilteredBooks);
}


/* =========================================
   MODAL (POP-UP) CLOSE EVENT LISTENERS
========================================= */
const closeModal = () => {
    // যদি ম্যানুয়ালি X বাটনে বা বাইরে ক্লিক করে বন্ধ করা হয়, তবে ব্রাউজারকে ব্যাক করতে বলা হচ্ছে
    if (modal.style.display === "flex") {
        window.history.back(); 
    }
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
authorFilter.addEventListener("change", filterBooks);
searchInput.addEventListener("input", filterBooks);


/* =========================================
   INITIALIZE APP
========================================= */
function initApp() {
    displayBooks(currentFilteredBooks);
    loadAuthors();
}

// Start Application
fetchBooks();