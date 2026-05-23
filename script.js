/* =========================================
   JSON BOOK DATABASE
========================================= */

const books = [

    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "purchaseDate": "12 January 2025",
        "purpose": "Habit Building & Self Improvement",
        "image": "images/atomic-habits.jpg"
    },

    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "purchaseDate": "8 February 2025",
        "purpose": "Motivation & Story Reading",
        "image": "images/alchemist.jpg"
    },

    {
        "title": "Deep Work",
        "author": "Cal Newport",
        "purchaseDate": "15 March 2025",
        "purpose": "Focus & Productivity",
        "image": "images/deep-work.jpg"
    },

    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "purchaseDate": "20 March 2025",
        "purpose": "Programming Learning",
        "image": "images/clean-code.jpg"
    },

    {
        "title": "Rich Dad Poor Dad",
        "author": "Robert Kiyosaki",
        "purchaseDate": "10 April 2025",
        "purpose": "Financial Knowledge",
        "image": "images/rich-dad.jpg"
    }

];

/* =========================================
   ELEMENTS
========================================= */

const booksGrid = document.getElementById("booksGrid");

const authorFilter = document.getElementById("authorFilter");

const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("bookModal");

const closeBtn = document.getElementById("closeBtn");

/* Modal Elements */

const modalImage = document.getElementById("modalImage");

const modalTitle = document.getElementById("modalTitle");

const modalAuthor = document.getElementById("modalAuthor");

const modalDate = document.getElementById("modalDate");

const modalPurpose = document.getElementById("modalPurpose");

/* =========================================
   DISPLAY BOOKS
========================================= */

function displayBooks(bookArray){

    booksGrid.innerHTML = "";

    if(bookArray.length === 0){

        booksGrid.innerHTML = `
        
        <h2 style="
            text-align:center;
            width:100%;
            color:#777;
        ">
            No books found.
        </h2>
        
        `;

        return;
    }

    bookArray.forEach(book => {

        const card = document.createElement("div");

        card.classList.add("book-card");

        card.innerHTML = `
        
            <img src="${book.image}" alt="${book.title}">

            <div class="book-info">

                <h3>${book.title}</h3>

                <p>${book.author}</p>

            </div>
        
        `;

        /* Modal Open */

        card.addEventListener("click", () => {

            modal.style.display = "flex";

            modalImage.src = book.image;

            modalTitle.textContent = book.title;

            modalAuthor.textContent = book.author;

            modalDate.textContent = book.purchaseDate;

            modalPurpose.textContent = book.purpose;

        });

        booksGrid.appendChild(card);

    });

}

/* =========================================
   LOAD AUTHORS
========================================= */

function loadAuthors(){

    const authors =
    [...new Set(books.map(book => book.author))];

    authors.forEach(author => {

        const option =
        document.createElement("option");

        option.value = author;

        option.textContent = author;

        authorFilter.appendChild(option);

    });

}

/* =========================================
   FILTER + SEARCH
========================================= */

function filterBooks(){

    const selectedAuthor =
    authorFilter.value;

    const searchText =
    searchInput.value.toLowerCase();

    let filteredBooks = books;

    /* Author Filter */

    if(selectedAuthor !== "all"){

        filteredBooks =
        filteredBooks.filter(book =>
            book.author === selectedAuthor
        );

    }

    /* Search Filter */

    filteredBooks =
    filteredBooks.filter(book =>
        book.title
        .toLowerCase()
        .includes(searchText)
    );

    displayBooks(filteredBooks);

}

/* Event Listeners */

authorFilter.addEventListener(
    "change",
    filterBooks
);

searchInput.addEventListener(
    "input",
    filterBooks
);

/* =========================================
   CLOSE MODAL
========================================= */

closeBtn.addEventListener("click", () => {

    modal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if(e.target === modal){

        modal.style.display = "none";

    }

});

/* =========================================
   INITIAL LOAD
========================================= */

displayBooks(books);

loadAuthors();