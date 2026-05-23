// script.js

// ============================
// Books Data
// ============================

const books = [

    {
        title: "Atomic Habits",
        author: "James Clear",
        purchaseDate: "12 January 2025",
        purpose: "Self Improvement এবং Habit Building",
        image: "images/atomic-habits.jpg"
    },

    {
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        purchaseDate: "20 February 2025",
        purpose: "Financial Knowledge",
        image: "images/rich-dad.jpg"
    },

    {
        title: "The Alchemist",
        author: "Paulo Coelho",
        purchaseDate: "15 March 2025",
        purpose: "Motivation এবং গল্প পড়া",
        image: "images/alchemist.jpg"
    },

    {
        title: "Clean Code",
        author: "Robert C. Martin",
        purchaseDate: "10 April 2025",
        purpose: "Programming শেখা",
        image: "images/clean-code.jpg"
    },

    {
        title: "Deep Work",
        author: "Cal Newport",
        purchaseDate: "5 May 2025",
        purpose: "Focus এবং Productivity",
        image: "images/deep-work.jpg"
    }

];

// ============================
// HTML Elements
// ============================

const booksContainer = document.getElementById("booksContainer");

const authorFilter = document.getElementById("authorFilter");

const modal = document.getElementById("bookModal");

const closeModal = document.getElementById("closeModal");

// Modal Elements

const modalImage = document.getElementById("modalImage");

const modalTitle = document.getElementById("modalTitle");

const modalAuthor = document.getElementById("modalAuthor");

const modalDate = document.getElementById("modalDate");

const modalPurpose = document.getElementById("modalPurpose");


// ============================
// Display Books
// ============================

function displayBooks(bookArray){

    booksContainer.innerHTML = "";

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

        // Open Modal

        card.addEventListener("click", () => {

            modal.style.display = "flex";

            modalImage.src = book.image;

            modalTitle.textContent = book.title;

            modalAuthor.textContent = book.author;

            modalDate.textContent = book.purchaseDate;

            modalPurpose.textContent = book.purpose;

        });

        booksContainer.appendChild(card);

    });

}


// ============================
// Populate Author Filter
// ============================

function loadAuthors(){

    const authors = [...new Set(books.map(book => book.author))];

    authors.forEach(author => {

        const option = document.createElement("option");

        option.value = author;

        option.textContent = author;

        authorFilter.appendChild(option);

    });

}


// ============================
// Filter Books
// ============================

authorFilter.addEventListener("change", () => {

    const selectedAuthor = authorFilter.value;

    if(selectedAuthor === "all"){

        displayBooks(books);

    }
    else{

        const filteredBooks = books.filter(book => 
            book.author === selectedAuthor
        );

        displayBooks(filteredBooks);

    }

});


// ============================
// Close Modal
// ============================

closeModal.addEventListener("click", () => {

    modal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if(e.target === modal){

        modal.style.display = "none";

    }

});


// ============================
// Initial Load
// ============================

displayBooks(books);

loadAuthors();