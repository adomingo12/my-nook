// Virtual Bookshelf Library - Main JavaScript
class BookshelfLibrary {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.currentFilters = {
            search: '',
            status: [],
            format: [],
            genre: [],
            pageCount: [],
            wordCount: [],
            rating: [],
            readingTime: [],
            datePublished: []
        };
        this.currentSort = 'title-asc';
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadBooks();
        this.initializeFilters();
        this.applyFilters(); // Use applyFilters instead of renderBooks directly
        this.updateStats();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.currentFilters.search = '';
            this.applyFilters();
        });

        // Filter category toggles
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-category-toggle') || e.target.closest('.filter-category-toggle')) {
                const toggle = e.target.classList.contains('filter-category-toggle') ? e.target : e.target.closest('.filter-category-toggle');
                const category = toggle.dataset.category;
                const options = document.getElementById(`${category}-options`);

                if (options) {
                    const isExpanded = options.classList.contains('expanded');
                    if (isExpanded) {
                        options.classList.remove('expanded');
                        toggle.classList.remove('expanded');
                    } else {
                        options.classList.add('expanded');
                        toggle.classList.add('expanded');
                    }
                }
            }

            // Genre subcategory toggles
            if (e.target.classList.contains('subcategory-toggle') || e.target.closest('.subcategory-toggle')) {
                const toggle = e.target.classList.contains('subcategory-toggle') ? e.target : e.target.closest('.subcategory-toggle');
                const subcategory = toggle.dataset.subcategory;
                const options = document.getElementById(`${subcategory}-options`);

                if (options) {
                    const isExpanded = options.classList.contains('expanded');
                    if (isExpanded) {
                        options.classList.remove('expanded');
                        toggle.classList.remove('expanded');
                    } else {
                        options.classList.add('expanded');
                        toggle.classList.add('expanded');
                    }
                }
            }
        });

        // Filter checkboxes - only for sidebar filters, not form checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name) {
                // Check if the checkbox is inside the filters sidebar, not the add book form
                const isInFiltersSidebar = e.target.closest('.filters-sidebar');
                if (isInFiltersSidebar) {
                    this.updateFilters();
                }
            }
        });

        // Sort control
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });



        // Clear filters button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clear-filters-btn')) {
                this.clearAllFilters();
            }
        });

        // Modal controls
        this.bindModalEvents();

        // Add book button
        document.getElementById('add-book-btn').addEventListener('click', () => {
            this.showAddBookModal();
        });

        // Statistics button
        document.getElementById('statistics-btn').addEventListener('click', () => {
            this.showStatisticsModal();
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // Initialize dark mode from localStorage
        this.initializeDarkMode();








        // Status change handler for date fields
        document.getElementById('book-status').addEventListener('change', (e) => {
            this.handleStatusChange(e.target.value);
        });

        // Star rating functionality
        this.initializeStarRating();



        // Sort control
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Book card clicks
        document.addEventListener('click', (e) => {
            const bookCard = e.target.closest('.book-card');
            if (bookCard) {
                const isbn = bookCard.dataset.isbn;
                const book = this.books.find(b => b.isbn === isbn);
                if (book) {
                    this.showBookDetail(book);
                }
            }
        });
    }

    bindModalEvents() {
        // Close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') ||
                e.target.classList.contains('modal-close')) {
                this.closeModals();
            }
        });

        // Add book form
        document.getElementById('add-book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBook();
        });

        document.getElementById('cancel-add-book').addEventListener('click', () => {
            this.closeModals();
        });

        // Image preview functionality
        document.getElementById('book-image-url').addEventListener('input', (e) => {
            this.updateImagePreview(e.target.value);
        });

        // Synopsis character count
        document.getElementById('book-synopsis').addEventListener('input', (e) => {
            this.updateCharacterCount(e.target.value.length);
        });

        // Format validation - at least one format must be selected
        const formatCheckboxes = document.querySelectorAll('input[name="format"]');
        formatCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.validateFormatSelection();
            });
        });
    }

    async loadBooks() {
        try {
            const response = await fetch('./data/books.json');
            if (response.ok) {
                const data = await response.json();
                this.books = data.books || [];
                this.migrateBothFormat();
            } else {
                // If no books.json exists, start with empty array
                this.books = [];
            }
        } catch (error) {
            console.log('No books.json found, starting with empty library');
            this.books = [];
        }

        this.filteredBooks = [...this.books];
    }

    migrateBothFormat() {
        // Convert old "Both" format to array of formats
        this.books.forEach(book => {
            if (book.format === 'Both') {
                book.format = ['Physical', 'Kindle'];
            } else if (!Array.isArray(book.format)) {
                book.format = [book.format || 'Physical'];
            }
        });
    }

    initializeFilters() {
        // Initialize all filter categories as collapsed
        const categories = ['status', 'format', 'genre', 'pageCount', 'wordCount', 'rating', 'readingTime', 'datePublished'];
        categories.forEach(category => {
            const options = document.getElementById(`${category}-options`);
            const toggle = document.querySelector(`[data-category="${category}"]`);
            if (options && toggle) {
                options.classList.remove('expanded');
                toggle.classList.remove('expanded');
            }
        });

        // Initialize all genre subcategories as collapsed
        const subcategories = ['fiction', 'non-fiction', 'age-categories', 'specialized'];
        subcategories.forEach(subcategory => {
            const options = document.getElementById(`${subcategory}-options`);
            const toggle = document.querySelector(`[data-subcategory="${subcategory}"]`);
            if (options && toggle) {
                options.classList.remove('expanded');
                toggle.classList.remove('expanded');
            }
        });
    }

    updateFilters() {
        // Collect all checked filters
        const filterTypes = ['status', 'format', 'genre', 'pageCount', 'wordCount', 'rating', 'readingTime', 'datePublished'];

        filterTypes.forEach(type => {
            const checkboxes = document.querySelectorAll(`input[name="${type}"]:checked`);
            this.currentFilters[type] = Array.from(checkboxes).map(cb => cb.value);
        });

        this.applyFilters();
    }

    handleStatusChange(status) {
        const dateStartedRow = document.getElementById('date-started-row');
        const dateFinishedField = document.getElementById('date-finished-field');

        if (status === 'Reading') {
            // Show date started row, hide date finished field within it
            dateStartedRow.style.display = 'grid';
            dateFinishedField.style.display = 'none';
        } else if (status === 'Finished') {
            // Show date started row and date finished field within it
            dateStartedRow.style.display = 'grid';
            dateFinishedField.style.display = 'block';
        } else {
            // Hide the entire date started row for TBR and DNF
            dateStartedRow.style.display = 'none';
        }
    }

    initializeStarRating() {
        const stars = document.querySelectorAll('.star-rating .star');
        const ratingInput = document.getElementById('book-rating');
        let currentRating = 0;

        stars.forEach((star, index) => {
            // Hover effect
            star.addEventListener('mouseenter', () => {
                this.highlightStars(stars, index + 1);
            });

            // Click to set rating
            star.addEventListener('click', () => {
                currentRating = index + 1;
                ratingInput.value = currentRating;
                this.setStarRating(stars, currentRating);
            });
        });

        // Reset hover effect when leaving star rating area
        document.querySelector('.star-rating').addEventListener('mouseleave', () => {
            this.setStarRating(stars, currentRating);
        });
    }

    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            star.classList.remove('filled', 'hover');
            if (index < rating) {
                star.classList.add('hover');
            }
        });
    }

    setStarRating(stars, rating) {
        stars.forEach((star, index) => {
            star.classList.remove('filled', 'hover');
            if (index < rating) {
                star.classList.add('filled');
            }
        });
    }

    clearAllFilters() {
        // Reset search input
        document.getElementById('search-input').value = '';

        // Uncheck all filter checkboxes
        const checkboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset current filters object
        this.currentFilters = {
            search: '',
            status: [],
            format: [],
            genre: [],
            pageCount: [],
            wordCount: [],
            rating: [],
            readingTime: [],
            datePublished: []
        };

        // Apply filters to show all books
        this.applyFilters();
    }

    getFormatBadges(formats) {
        // Handle both array and single format for backward compatibility
        const formatArray = Array.isArray(formats) ? formats : [formats];

        return formatArray.map(format => {
            const formatLower = format?.toLowerCase() || 'physical';
            const formatDisplay = format || 'Physical';
            return `<span class="badge format-${formatLower}">${formatDisplay}</span>`;
        }).join(' ');
    }

    getSelectedFormats() {
        const checkboxes = document.querySelectorAll('input[name="format"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    setSelectedFormats(formats) {
        // Clear all format checkboxes first
        document.querySelectorAll('input[name="format"]').forEach(cb => {
            cb.checked = false;
        });

        // Handle both array and single format
        const formatArray = Array.isArray(formats) ? formats : [formats];

        formatArray.forEach(format => {
            const checkbox = document.querySelector(`input[name="format"][value="${format}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    updateImagePreview(url) {
        const preview = document.getElementById('book-cover-preview');
        const placeholder = document.getElementById('preview-placeholder');

        if (url && url.trim()) {
            preview.src = url;
            preview.style.display = 'block';
            placeholder.style.display = 'none';

            // Handle image load errors
            preview.onerror = () => {
                preview.style.display = 'none';
                placeholder.style.display = 'block';
            };
        } else {
            preview.style.display = 'none';
            placeholder.style.display = 'block';
        }
    }

    updateCharacterCount(count) {
        const counter = document.getElementById('synopsis-count');
        if (counter) {
            counter.textContent = count;

            // Change color based on character count
            if (count > 450) {
                counter.style.color = '#ef4444'; // Red
            } else if (count > 400) {
                counter.style.color = '#f59e0b'; // Yellow
            } else {
                counter.style.color = '#6b7280'; // Gray
            }
        }
    }

    validateFormatSelection() {
        const formatCheckboxes = document.querySelectorAll('input[name="format"]');
        const isAnyChecked = Array.from(formatCheckboxes).some(cb => cb.checked);

        // Remove required attribute from all checkboxes if at least one is checked
        formatCheckboxes.forEach(cb => {
            if (isAnyChecked) {
                cb.removeAttribute('required');
            } else {
                cb.setAttribute('required', 'required');
            }
        });

        return isAnyChecked;
    }

    applyFilters() {
        this.filteredBooks = this.books.filter(book => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const titleMatch = book.title?.toLowerCase().includes(searchTerm);
                const authorMatch = book.author?.toLowerCase().includes(searchTerm);
                const genreMatch = book.genre?.toLowerCase().includes(searchTerm);

                // Handle format search (both array and single format)
                let formatMatch = false;
                if (Array.isArray(book.format)) {
                    formatMatch = book.format.some(f => f.toLowerCase().includes(searchTerm));
                } else if (book.format) {
                    formatMatch = book.format.toLowerCase().includes(searchTerm);
                }

                if (!titleMatch && !authorMatch && !genreMatch && !formatMatch) return false;
            }

            // Status filter
            if (this.currentFilters.status.length > 0 && !this.currentFilters.status.includes(book.status)) {
                return false;
            }

            // Format filter
            if (this.currentFilters.format.length > 0) {
                const bookFormats = Array.isArray(book.format) ? book.format : [book.format];
                if (!bookFormats.some(format => this.currentFilters.format.includes(format))) {
                    return false;
                }
            }

            // Genre filter
            if (this.currentFilters.genre.length > 0 && !this.currentFilters.genre.includes(book.genre)) {
                return false;
            }

            // Page count filter
            if (this.currentFilters.pageCount.length > 0) {
                const pageCount = book.pageCount || 0;
                const matchesRange = this.currentFilters.pageCount.some(range => {
                    if (range === '0-100') return pageCount <= 100;
                    if (range === '101-200') return pageCount >= 101 && pageCount <= 200;
                    if (range === '201-300') return pageCount >= 201 && pageCount <= 300;
                    if (range === '301-400') return pageCount >= 301 && pageCount <= 400;
                    if (range === '401-500') return pageCount >= 401 && pageCount <= 500;
                    if (range === '501-600') return pageCount >= 501 && pageCount <= 600;
                    if (range === '601-700') return pageCount >= 601 && pageCount <= 700;
                    if (range === '701-800') return pageCount >= 701 && pageCount <= 800;
                    if (range === '801+') return pageCount >= 801;
                    if (range === '800+') return pageCount >= 800;
                    return false;
                });
                if (!matchesRange) return false;
            }

            // Word count filter (estimated from page count)
            if (this.currentFilters.wordCount.length > 0) {
                const estimatedWords = (book.pageCount || 0) * 275;
                const matchesRange = this.currentFilters.wordCount.some(range => {
                    if (range === '0-25000') return estimatedWords <= 25000;
                    if (range === '25001-50000') return estimatedWords >= 25001 && estimatedWords <= 50000;
                    if (range === '50001-75000') return estimatedWords >= 50001 && estimatedWords <= 75000;
                    if (range === '75001-100000') return estimatedWords >= 75001 && estimatedWords <= 100000;
                    if (range === '100001-125000') return estimatedWords >= 100001 && estimatedWords <= 125000;
                    if (range === '125001-150000') return estimatedWords >= 125001 && estimatedWords <= 150000;
                    if (range === '150001+') return estimatedWords >= 150001;
                    return false;
                });
                if (!matchesRange) return false;
            }

            // Rating filter
            if (this.currentFilters.rating.length > 0) {
                const userRating = book.userRating || 0;
                const matchesRating = this.currentFilters.rating.some(minRating => {
                    return userRating >= parseInt(minRating);
                });
                if (!matchesRating) return false;
            }

            // Reading time filter (estimated from page count at 60 pages/hour)
            if (this.currentFilters.readingTime.length > 0) {
                const estimatedHours = (book.pageCount || 0) / 60;
                const matchesRange = this.currentFilters.readingTime.some(range => {
                    if (range === '0-3') return estimatedHours <= 3;
                    if (range === '3-6') return estimatedHours >= 3 && estimatedHours <= 6;
                    if (range === '6-9') return estimatedHours >= 6 && estimatedHours <= 9;
                    if (range === '9-12') return estimatedHours >= 9 && estimatedHours <= 12;
                    if (range === '12-15') return estimatedHours >= 12 && estimatedHours <= 15;
                    if (range === '15+') return estimatedHours >= 15;
                    return false;
                });
                if (!matchesRange) return false;
            }

            // Date Published filter
            if (this.currentFilters.datePublished.length > 0) {
                const publishedDate = book.datePublished ? new Date(book.datePublished) : null;
                if (!publishedDate) return false; // Skip books without publication date

                const publishedYear = publishedDate.getFullYear();
                const matchesRange = this.currentFilters.datePublished.some(range => {
                    if (range === '2020-2024') return publishedYear >= 2020 && publishedYear <= 2024;
                    if (range === '2015-2019') return publishedYear >= 2015 && publishedYear <= 2019;
                    if (range === '2010-2014') return publishedYear >= 2010 && publishedYear <= 2014;
                    if (range === '2005-2009') return publishedYear >= 2005 && publishedYear <= 2009;
                    if (range === '2000-2004') return publishedYear >= 2000 && publishedYear <= 2004;
                    if (range === '1995-1999') return publishedYear >= 1995 && publishedYear <= 1999;
                    if (range === '1990-1994') return publishedYear >= 1990 && publishedYear <= 1994;
                    if (range === 'before-1990') return publishedYear < 1990;
                    return false;
                });
                if (!matchesRange) return false;
            }

            return true;
        });

        this.sortBooks();
        this.renderBooks();
    }

    sortBooks() {
        const [field, direction] = this.currentSort.split('-');

        this.filteredBooks.sort((a, b) => {
            let aValue, bValue;

            switch (field) {
                case 'title':
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
                    break;
                case 'author':
                    aValue = a.author?.toLowerCase() || '';
                    bValue = b.author?.toLowerCase() || '';
                    break;
                case 'dateAdded':
                    aValue = new Date(a.dateAdded || 0);
                    bValue = new Date(b.dateAdded || 0);
                    break;
                case 'dateFinished':
                    aValue = new Date(a.dateFinished || 0);
                    bValue = new Date(b.dateFinished || 0);
                    break;
                case 'datePublished':
                    aValue = new Date(a.datePublished || 0);
                    bValue = new Date(b.datePublished || 0);
                    break;
                case 'rating':
                    aValue = a.userRating || 0;
                    bValue = b.userRating || 0;
                    break;
                case 'pageCount':
                    aValue = a.pageCount || 0;
                    bValue = b.pageCount || 0;
                    break;
                default:
                    return 0;
            }

            if (direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }

    renderBooks() {
        const bookshelf = document.getElementById('bookshelf');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredBooks.length === 0) {
            bookshelf.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        bookshelf.innerHTML = this.filteredBooks.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const coverUrl = book.coverUrl || '';

        return `
            <div class="book-card" data-isbn="${book.isbn}">
                <div class="book-cover-container">
                    ${coverUrl ?
                        `<img src="${coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">` :
                        `<div class="book-cover-placeholder">No Cover Available</div>`
                    }
                    <div class="bottom-badges">
                        <span class="badge status-${book.status?.toLowerCase() || 'tbr'}">${book.status || 'TBR'}</span>
                        ${this.getFormatBadges(book.format)}
                    </div>
                </div>
            </div>
        `;
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
        }
        return stars;
    }

    updateStats() {
        const totalBooks = this.books.length;
        const finishedBooks = this.books.filter(book => book.status === 'Finished').length;
        const currentlyReading = this.books.filter(book => book.status === 'Reading').length;
        const toBeRead = this.books.filter(book => book.status === 'TBR').length;

        const totalPages = this.books.reduce((sum, book) => sum + (book.pageCount || 0), 0);

        // Calculate reading time at 60 pages per hour
        const totalHours = Math.round(totalPages / 60);

        // Calculate average rating
        const ratedBooks = this.books.filter(book => book.userRating > 0);
        const avgRating = ratedBooks.length > 0
            ? (ratedBooks.reduce((sum, book) => sum + book.userRating, 0) / ratedBooks.length).toFixed(1)
            : 0;

        // Calculate books read this year
        const currentYear = new Date().getFullYear();
        const booksThisYear = this.books.filter(book =>
            book.status === 'Finished' &&
            book.dateFinished &&
            book.dateFinished.startsWith(currentYear.toString())
        ).length;

        // Update sidebar stats
        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('books-read').textContent = finishedBooks;
        document.getElementById('currently-reading').textContent = currentlyReading;
        document.getElementById('to-be-read').textContent = toBeRead;
        document.getElementById('average-rating').textContent = avgRating;
        document.getElementById('total-pages').textContent = totalPages.toLocaleString();
        document.getElementById('reading-time').textContent = `${totalHours} hr`;
        document.getElementById('books-this-year').textContent = booksThisYear;

    }

    showBookDetail(book) {
        const modal = document.getElementById('book-modal');
        const modalBody = modal.querySelector('.modal-body');

        const estimatedWords = (book.pageCount || 0) * 275;
        const estimatedHours = Math.round(estimatedWords / 250 / 60 * 10) / 10;
        const userStars = this.generateStars(book.userRating || 0);
        const apiStars = this.generateStars(Math.round(book.averageRating || 0));

        modalBody.innerHTML = `
            <div class="book-detail">
                <div class="book-detail-cover-container">
                    ${book.coverUrl ?
                        `<img src="${book.coverUrl}" alt="${book.title}" class="book-detail-cover">` :
                        `<div class="book-cover-placeholder" style="width: 200px; height: 300px;">No Cover Available</div>`
                    }
                </div>
                <div class="book-detail-info">
                    <h3>${book.title || 'Unknown Title'}</h3>
                    <p class="book-detail-author">by ${book.author || 'Unknown Author'}</p>

                    ${book.synopsis ? `
                        <div class="book-synopsis">
                            <h4>Synopsis</h4>
                            <p>${book.synopsis}</p>
                        </div>
                    ` : ''}

                    <div class="book-detail-meta">
                        <div class="meta-item">
                            <div class="meta-label">Status</div>
                            <div class="meta-value">
                                <span class="badge status-${book.status?.toLowerCase() || 'tbr'}">${book.status || 'TBR'}</span>
                            </div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Format</div>
                            <div class="meta-value">
                                ${this.getFormatBadges(book.format)}
                            </div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Pages</div>
                            <div class="meta-value">${book.pageCount || 0}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Est. Words</div>
                            <div class="meta-value">${estimatedWords.toLocaleString()}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Est. Reading Time</div>
                            <div class="meta-value">${estimatedHours} hr</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Genre</div>
                            <div class="meta-value">${book.genre || 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Date Published</div>
                            <div class="meta-value">${book.datePublished ? new Date(book.datePublished).toLocaleDateString() : 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">My Rating</div>
                            <div class="meta-value">
                                <div class="stars">${userStars}</div>
                            </div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Average Rating</div>
                            <div class="meta-value">
                                <div class="stars">${apiStars}</div>
                                <small>${(book.averageRating || 0).toFixed(1)}/5</small>
                            </div>
                        </div>
                    </div>

                    ${book.dateStarted || book.dateFinished ? `
                        <div class="book-dates">
                            <h4>Reading History</h4>
                            ${book.dateStarted ? `<p><strong>Started:</strong> ${new Date(book.dateStarted).toLocaleDateString()}</p>` : ''}
                            ${book.dateFinished ? `<p><strong>Finished:</strong> ${new Date(book.dateFinished).toLocaleDateString()}</p>` : ''}
                        </div>
                    ` : ''}

                    ${book.status === 'Reading' ? `
                        <div class="reading-controls">
                            <h4>Reading Progress</h4>
                            <div class="progress-input">
                                <label for="current-page">Current Page:</label>
                                <input type="number" id="current-page" min="0" max="${book.pageCount || 999}"
                                       value="${book.currentPage || 0}" placeholder="0">
                                <button onclick="window.bookshelf.updateProgress('${book.isbn}', document.getElementById('current-page').value)"
                                        class="btn-primary">Update Progress</button>
                            </div>
                        </div>
                    ` : ''}

                    <div class="book-actions">
                        <button onclick="window.bookshelf.editBook('${book.isbn}')" class="btn-secondary">Edit Book</button>
                        <button onclick="window.bookshelf.deleteBook('${book.isbn}')" class="btn-danger">Remove Book</button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

        // Make this instance available globally for modal interactions
        window.bookshelf = this;
    }

    showAddBookModal() {
        document.getElementById('add-book-modal').classList.remove('hidden');
        // Initialize date fields based on default status (TBR)
        this.handleStatusChange('TBR');
    }

    showStatisticsModal() {
        document.getElementById('statistics-modal').classList.remove('hidden');
    }

    showSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const toggle = document.getElementById('dark-mode-toggle');

        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggle.checked = false;
        }
    }

    toggleDarkMode(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });

        // Reset add book form
        document.getElementById('add-book-form').reset();

        // Reset form title and button text
        const addModal = document.getElementById('add-book-modal');
        const title = addModal.querySelector('h2');
        const submitBtn = addModal.querySelector('button[type="submit"]');

        title.textContent = 'Add New Book';
        submitBtn.textContent = 'Add Book';

        // Clear all form fields
        document.getElementById('book-image-url').value = '';
        document.getElementById('book-synopsis').value = '';

        // Reset image preview
        this.updateImagePreview('');

        // Reset character count
        this.updateCharacterCount(0);

        // Reset date fields visibility
        this.handleStatusChange('TBR');

        // Reset star rating
        const stars = document.querySelectorAll('.star-rating .star');
        this.setStarRating(stars, 0);
        document.getElementById('book-rating').value = '';

        // Clear editing state
        this.editingBook = null;
    }

    async handleAddBook() {
        const form = document.getElementById('add-book-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        // Validate required fields
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const genre = document.getElementById('book-genre').value.trim();
        const synopsis = document.getElementById('book-synopsis').value.trim();
        const pages = parseInt(document.getElementById('book-pages').value) || 0;
        const datePublished = document.getElementById('book-date-published').value || null;
        const imageUrl = document.getElementById('book-image-url').value.trim();
        const selectedFormats = this.getSelectedFormats();
        const rating = parseInt(document.getElementById('book-rating').value) || 0;

        if (!title) {
            this.showNotification('Please enter a book title', 'error');
            return;
        }
        if (!author) {
            this.showNotification('Please enter an author name', 'error');
            return;
        }
        if (!genre) {
            this.showNotification('Please enter a genre', 'error');
            return;
        }
        if (!synopsis) {
            this.showNotification('Please enter a synopsis', 'error');
            return;
        }
        if (!pages || pages <= 0) {
            this.showNotification('Please enter a valid page count', 'error');
            return;
        }
        if (!imageUrl) {
            this.showNotification('Please enter an image URL', 'error');
            return;
        }
        if (selectedFormats.length === 0) {
            this.showNotification('Please select at least one format', 'error');
            return;
        }
        if (rating === 0) {
            this.showNotification('Please provide a rating', 'error');
            return;
        }

        // Show loading state
        submitBtn.textContent = 'Adding Book...';
        submitBtn.disabled = true;

        try {
            let bookData;

            if (this.editingBook) {
                // Editing existing book - preserve existing data
                bookData = {
                    ...this.editingBook, // Start with existing book data
                    // Update only the user-editable fields
                    title: title,
                    author: author,
                    genre: genre,
                    synopsis: synopsis,
                    pageCount: pages,
                    datePublished: datePublished,
                    status: document.getElementById('book-status').value,
                    format: selectedFormats,
                    userRating: rating,
                    coverUrl: imageUrl,
                    // Update date fields
                    dateStarted: document.getElementById('book-date-started').value || null,
                    dateFinished: document.getElementById('book-date-finished').value || null,
                    // Keep existing metadata
                    dateAdded: this.editingBook.dateAdded,
                    averageRating: this.editingBook.averageRating || 0,
                    lastApiUpdate: this.editingBook.lastApiUpdate
                };

                // Update reading dates based on status changes
                const originalStatus = this.editingBook.status;
                if (bookData.status !== originalStatus) {
                    // Status changed during editing
                    if (bookData.status === 'Reading' && !bookData.dateStarted) {
                        bookData.dateStarted = new Date().toISOString().split('T')[0];
                    } else if (bookData.status === 'Finished') {
                        if (!bookData.dateStarted) {
                            bookData.dateStarted = new Date().toISOString().split('T')[0];
                        }
                        if (!bookData.dateFinished) {
                            bookData.dateFinished = new Date().toISOString().split('T')[0];
                        }
                    } else if (bookData.status === 'TBR' && originalStatus !== 'TBR') {
                        // Only reset dates if moving back to TBR from another status
                        bookData.dateStarted = null;
                        bookData.dateFinished = null;
                        bookData.currentPage = 0;
                    } else if (bookData.status === 'DNF') {
                        // For DNF, keep start date but clear finish date
                        if (!bookData.dateStarted) {
                            bookData.dateStarted = new Date().toISOString().split('T')[0];
                        }
                        bookData.dateFinished = null;
                    }
                }
            } else {
                // Adding new book
                bookData = {
                    isbn: `manual-${Date.now()}`,
                    title: title,
                    author: author,
                    genre: genre,
                    synopsis: synopsis,
                    pageCount: pages,
                    datePublished: datePublished,
                    status: document.getElementById('book-status').value,
                    format: selectedFormats,
                    userRating: rating,
                    dateAdded: new Date().toISOString().split('T')[0],
                    dateStarted: document.getElementById('book-date-started').value || null,
                    dateFinished: document.getElementById('book-date-finished').value || null,
                    currentPage: 0,
                    coverUrl: imageUrl,
                    averageRating: 0
                };

                // Set reading dates based on status for new books
                if (bookData.status === 'Reading') {
                    bookData.dateStarted = new Date().toISOString().split('T')[0];
                } else if (bookData.status === 'Finished') {
                    bookData.dateStarted = new Date().toISOString().split('T')[0];
                    bookData.dateFinished = new Date().toISOString().split('T')[0];
                }

                // No API fetching - using manual data entry only
            }

            // Handle editing vs adding
            if (this.editingBook) {
                // Update existing book
                const index = this.books.findIndex(b => b.isbn === this.editingBook.isbn);
                if (index !== -1) {
                    this.books[index] = bookData;
                    this.showNotification(`"${bookData.title}" has been updated!`, 'success');
                } else {
                    // Fallback: if book not found by ISBN, try to find by original reference
                    const originalIndex = this.books.indexOf(this.editingBook);
                    if (originalIndex !== -1) {
                        this.books[originalIndex] = bookData;
                        this.showNotification(`"${bookData.title}" has been updated!`, 'success');
                    }
                }
                this.editingBook = null;
            } else {
                // Adding new book - check for duplicates
                const existingBook = this.books.find(book =>
                    book.isbn === bookData.isbn ||
                    (book.title.toLowerCase() === bookData.title.toLowerCase() &&
                     book.author.toLowerCase() === bookData.author.toLowerCase())
                );

                if (existingBook) {
                    alert('This book already exists in your library!');
                    return;
                }

                this.books.push(bookData);
                this.showNotification(`"${bookData.title}" has been added to your library!`, 'success');
            }
            this.applyFilters();
            this.updateStats();
            this.closeModals();

            // In a real implementation, this would save to the server
            console.log('Book processed:', bookData);

        } catch (error) {
            console.error('Error adding book:', error);
            this.showNotification('Failed to add book. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }



    updateProgress(isbn, currentPage) {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            book.currentPage = parseInt(currentPage) || 0;

            // Auto-complete if reached the end
            if (book.currentPage >= book.pageCount && book.pageCount > 0) {
                book.status = 'Finished';
                book.dateFinished = new Date().toISOString().split('T')[0];
                this.showNotification(`Congratulations! You've finished "${book.title}"!`, 'success');
            }

            this.applyFilters();
            this.updateStats();
            this.showNotification('Progress updated!', 'success');

            // Refresh the modal
            this.showBookDetail(book);
        }
    }

    editBook(isbn) {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            // Store the original book for updating BEFORE opening the modal
            this.editingBook = book;

            // Close current modal first
            this.closeModals();

            // Wait a moment for the modal to close, then open the edit form
            setTimeout(() => {
                // Pre-fill the add book form with existing data
                document.getElementById('book-image-url').value = book.coverUrl || '';
                document.getElementById('book-title').value = book.title || '';
                document.getElementById('book-author').value = book.author || '';
                document.getElementById('book-genre').value = book.genre || '';
                document.getElementById('book-synopsis').value = book.synopsis || '';
                document.getElementById('book-pages').value = book.pageCount || '';
                document.getElementById('book-date-published').value = book.datePublished || '';
                document.getElementById('book-status').value = book.status || 'TBR';

                // Update image preview
                this.updateImagePreview(book.coverUrl || '');

                // Update character count
                this.updateCharacterCount((book.synopsis || '').length);

                // Handle format - convert old "Both" format to array
                let bookFormats = book.format;
                if (bookFormats === 'Both') {
                    bookFormats = ['Physical', 'Kindle'];
                } else if (!Array.isArray(bookFormats)) {
                    bookFormats = [bookFormats || 'Physical'];
                }
                this.setSelectedFormats(bookFormats);

                // Handle date fields based on status
                this.handleStatusChange(book.status || 'TBR');
                if (book.dateStarted) {
                    document.getElementById('book-date-started').value = book.dateStarted;
                }
                if (book.dateFinished) {
                    document.getElementById('book-date-finished').value = book.dateFinished;
                }

                // Set star rating
                const stars = document.querySelectorAll('.star-rating .star');
                const rating = book.userRating || 0;
                document.getElementById('book-rating').value = rating;
                this.setStarRating(stars, rating);

                // Image URL field remains enabled during editing

                // Change form title and button text
                const modal = document.getElementById('add-book-modal');
                const title = modal.querySelector('h2');
                const submitBtn = modal.querySelector('button[type="submit"]');

                title.textContent = 'Edit Book';
                submitBtn.textContent = 'Update Book';

                // Open the modal
                modal.classList.remove('hidden');
            }, 100);
        }
    }

    deleteBook(isbn) {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            const confirmMessage = `Are you sure you want to remove "${book.title}" by ${book.author || 'Unknown Author'} from your library?\n\nThis action cannot be undone.`;

            if (confirm(confirmMessage)) {
                this.books = this.books.filter(b => b.isbn !== isbn);
                this.applyFilters();
                this.updateStats();
                this.closeModals();
                this.showNotification(`"${book.title}" has been removed from your library.`, 'info');
            }
        }
    }


}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookshelfLibrary();
});
