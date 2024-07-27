const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

document.addEventListener('DOMContentLoaded', function() {
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
        { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
        { text: "Life is what happens when you're busy making other plans.", category: "Life" },
        { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", category: "Inspiration" }
    ];

    const quoteDisplay = document.getElementById('quoteDisplay');
    const newQuoteBtn = document.getElementById('newQuote');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const exportQuotesBtn = document.getElementById('exportQuotes');
    const importFileInput = document.getElementById('importFile');

    function populateCategories() {
        const categories = [...new Set(quotes.map(quote => quote.category))];
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        const savedFilter = localStorage.getItem('selectedCategory');
        if (savedFilter) {
            categoryFilter.value = savedFilter;
        }
    }

    function filterQuotes() {
        const selectedCategory = categoryFilter.value;
        localStorage.setItem('selectedCategory', selectedCategory);
        displayQuotes(selectedCategory);
    }

    function displayQuotes(category) {
        quoteDisplay.innerHTML = '';
        const filteredQuotes = category === 'all' ? quotes : quotes.filter(quote => quote.category === category);
        filteredQuotes.forEach(quote => {
            const quoteElement = document.createElement('p');
            quoteElement.innerHTML = `"${quote.text}"<br>- ${quote.category}`;
            quoteDisplay.appendChild(quoteElement);
        });
    }

    function showRandomQuote() {
        const filteredQuotes = categoryFilter.value === 'all' ? quotes : quotes.filter(quote => quote.category === categoryFilter.value);
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];
        quoteDisplay.innerHTML = `<p>"${randomQuote.text}"</p><p>- ${randomQuote.category}</p>`;
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
    }

    function addQuote() {
        const newQuoteText = document.getElementById('newQuoteText').value.trim();
        const newQuoteCategory = document.getElementById('newQuoteCategory').value.trim();

        if (newQuoteText && newQuoteCategory) {
            quotes.push({ text: newQuoteText, category: newQuoteCategory });
            saveQuotes();
            document.getElementById('newQuoteText').value = '';
            document.getElementById('newQuoteCategory').value = '';
            alert('Quote added successfully!');
            populateCategories();
        } else {
            alert('Please enter both quote text and category.');
        }
    }

    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }

    function exportToJson() {
        const blob = new Blob([JSON.stringify(quotes)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function importFromJsonFile(event) {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            const importedQuotes = JSON.parse(event.target.result);
            quotes.push(...importedQuotes);
            saveQuotes();
            alert('Quotes imported successfully!');
            populateCategories();
            filterQuotes();
        };
        fileReader.readAsText(event.target.files[0]);
    }

    async function fetchQuotesFromServer() {
        try {
            const response = await fetch(SERVER_URL);
            const data = await response.json();
            return data.map(post => ({ text: post.title, category: 'Server' }));
        } catch (error) {
            console.error('Error fetching quotes from server:', error);
            return [];
        }
    }

    async function syncWithServer() {
        try {
            const serverQuotes = await fetchQuotesFromServer();
            const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
            const mergedQuotes = mergeQuotes(localQuotes, serverQuotes);
            quotes = mergedQuotes;
            saveQuotes();
            populateCategories();
            filterQuotes();
            alert('Data synced with the server!');
        } catch (error) {
            console.error('Error syncing with server:', error);
        }
    }

    function mergeQuotes(localQuotes, serverQuotes) {
        const mergedQuotes = [...localQuotes];
        serverQuotes.forEach(serverQuote => {
            if (!localQuotes.some(localQuote => localQuote.text === serverQuote.text)) {
                mergedQuotes.push(serverQuote);
            }
        });
        return mergedQuotes;
    }

    function startPeriodicSync(interval = 60000) {
        setInterval(syncWithServer, interval);
    }

    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    addQuoteBtn.addEventListener('click', addQuote);
    exportQuotesBtn.addEventListener('click', exportToJson);
    importFileInput.addEventListener('change', importFromJsonFile);
    categoryFilter.addEventListener('change', filterQuotes);

    // Initial setup
    populateCategories();
    filterQuotes();

    // Load last viewed quote from session storage if available
    const lastViewedQuote = JSON.parse(sessionStorage.getItem('lastViewedQuote'));
    if (lastViewedQuote) {
        quoteDisplay.innerHTML = `<p>"${lastViewedQuote.text}"</p><p>- ${lastViewedQuote.category}</p>`;
    }

    // Start periodic sync
    startPeriodicSync();
});
