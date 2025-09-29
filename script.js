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
            author: [],
            pageCount: [],
            publisher: [],
            rating: [],
            datePublished: [],
            yearRead: [],
            series: []
        };
        this.currentSort = 'author-series-asc';

        // Authentication properties
        this.isAuthenticated = false;
        this.pendingAction = null; // Store the action to perform after authentication
        this.editingBook = null;

        // Pagination properties
        this.currentPage = 1;
        this.booksPerPage = {
            grid: parseInt(localStorage.getItem('booksPerPage_grid')) || 40,
            list: parseInt(localStorage.getItem('booksPerPage_list')) || 20
        };

        // Initialize Supabase client
        this.supabase = null;
        this.initializeSupabase();

        this.init();
    }

    initializeSupabase() {
        // Supabase configuration
        let supabaseUrl, supabaseKey;

        if (window.CONFIG && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_KEY) {
            supabaseUrl = window.CONFIG.SUPABASE_URL;
            supabaseKey = window.CONFIG.SUPABASE_KEY;

            // Check if using placeholder key
            if (supabaseKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
                console.error('❌ Please replace placeholder with your actual Supabase anon key');
                this.showNotification('Database configuration incomplete. Using local storage.', 'warning');
                return;
            }

            console.log('✅ Using Supabase configuration');
        } else {
            console.error('❌ No Supabase configuration found. Using local storage.');
            this.showNotification('Database unavailable. Using local storage.', 'warning');
            return;
        }

        try {
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
            this.showNotification('Database connection failed. Using local storage.', 'warning');
        }
    }

    async init() {
        // Make this instance available globally for modal interactions
        window.bookshelf = this;

        // Test database connection first
        await this.testDatabaseConnection();

        this.bindEvents();
        await this.loadBooks();
        this.initializeFilters();
        this.populateSeriesFilter(); // Populate series filter after books are loaded
        this.populateGenreFilter(); // Populate genre filter after books are loaded
        this.populatePublisherFilter(); // Populate publisher filter after books are loaded
        this.populateAuthorFilter(); // Populate author filter after books are loaded
        this.populateYearReadFilter(); // Populate year read filter after books are loaded
        this.populatePageCountFilter(); // Populate page count filter after books are loaded
        this.populateDatePublishedFilter(); // Populate date published filter after books are loaded
        this.updateFilterCounts(); // Update all filter counts
        this.applyFilters(); // Use applyFilters instead of renderBooks directly
        this.updateStats();
        this.updateAuthStatus(); // Initialize authentication status display

        // Add global debug functions
        window.debugBookshelf = {
            authenticate: () => { this.isAuthenticated = true; this.updateAuthStatus(); },
            showBooks: () => console.log('Books:', this.books),
            showInstance: () => console.log('Bookshelf instance:', this)
        };
        console.log('🔧 Debug functions available: window.debugBookshelf');
    }

    // Test database connection
    async testDatabaseConnection() {
        if (!this.supabase) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('reading_nook')
                .select('count', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            console.log('✅ Database connection successful');
            this.showNotification('Connected to database successfully', 'success');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            this.showNotification('Database connection failed. Using local storage.', 'warning');
        }
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();

            // Update mobile search input
            const mobileSearchInput = document.getElementById('mobile-search-input');
            if (mobileSearchInput && mobileSearchInput.value !== e.target.value) {
                mobileSearchInput.value = e.target.value;
            }
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.currentFilters.search = '';
            this.applyFilters();

            // Clear mobile search input
            const mobileSearchInput = document.getElementById('mobile-search-input');
            if (mobileSearchInput) {
                mobileSearchInput.value = '';
            }
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
                    // Close mobile filters after selection on mobile
                    if (window.innerWidth <= 768) {
                        setTimeout(() => this.closeMobileFilters(), 300);
                    }
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

        // Mobile filter toggle (hamburger menu)
        document.getElementById('mobile-filter-toggle').addEventListener('click', () => {
            this.toggleMobileFilters();
        });

        // Mobile search toggle
        document.getElementById('mobile-search-toggle').addEventListener('click', () => {
            this.openMobileSearch();
        });

        // Mobile search close
        document.getElementById('mobile-search-close').addEventListener('click', () => {
            this.closeMobileSearch();
        });

        // Mobile search input
        document.getElementById('mobile-search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Close mobile search when clicking outside
        document.getElementById('mobile-search-modal').addEventListener('click', (e) => {
            if (e.target.id === 'mobile-search-modal') {
                this.closeMobileSearch();
            }
        });

        // Mobile close button
        document.getElementById('mobile-close-btn').addEventListener('click', () => {
            this.closeMobileFilters();
        });

        // Mobile auth toggle (collapse/expand auth section)
        document.getElementById('mobile-auth-toggle').addEventListener('click', () => {
            this.toggleAuthCollapse();
        });

        // Mobile auth submit
        document.getElementById('mobile-auth-submit').addEventListener('click', () => {
            const username = document.getElementById('mobile-auth-username').value;
            const password = document.getElementById('mobile-auth-password').value;
            this.authenticate(username, password, true); // true = mobile
        });

        // Mobile logout button
        document.getElementById('mobile-logout-btn').addEventListener('click', () => {
            this.logout(true); // true = mobile
        });

        // Mobile auth password - submit on Enter
        document.getElementById('mobile-auth-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const username = document.getElementById('mobile-auth-username').value;
                const password = document.getElementById('mobile-auth-password').value;
                this.authenticate(username, password, true);
            }
        });

        // Mobile filters toggle (collapse/expand filters section)
        document.getElementById('mobile-filters-toggle').addEventListener('click', () => {
            this.toggleFiltersCollapse();
        });

        // Mobile add book button
        document.getElementById('mobile-add-book-btn').addEventListener('click', () => {
            this.showAddBookModal();
            this.closeMobileFilters();
        });

        // Mobile stats button
        document.getElementById('mobile-stats-btn').addEventListener('click', () => {
            this.showStatisticsModal();
            this.closeMobileFilters();
        });

        // Mobile sort toggle (collapse/expand sort section)
        document.getElementById('mobile-sort-toggle').addEventListener('click', () => {
            this.toggleSortCollapse();
        });

        // Mobile sort options
        document.querySelectorAll('.mobile-sort-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortValue = e.target.dataset.sort;

                // Update active state
                document.querySelectorAll('.mobile-sort-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Sync desktop sort select
                const desktopSort = document.getElementById('sort-select');
                if (desktopSort) {
                    desktopSort.value = sortValue;
                }

                // Apply sort
                this.currentSort = sortValue;
                this.applyFilters();
            });
        });

        // Mobile settings toggle (collapse/expand settings section)
        document.getElementById('mobile-settings-toggle').addEventListener('click', () => {
            this.toggleSettingsCollapse();
        });

        // Mobile dark mode toggle
        document.getElementById('mobile-dark-mode-toggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // Mobile pagination buttons
        document.querySelectorAll('.mobile-pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.target.dataset.count);
                this.booksPerPage.grid = count;
                localStorage.setItem('booksPerPageGrid', count);

                // Update active state
                document.querySelectorAll('.mobile-pagination-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Reset to first page and re-render
                this.currentPage = 1;
                this.renderBooks();
            });
        });

        // Close mobile filters when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.filters-sidebar');
            const toggleBtn = document.getElementById('mobile-filter-toggle');

            if (sidebar.classList.contains('mobile-open') &&
                !sidebar.contains(e.target) &&
                !toggleBtn.contains(e.target)) {
                this.closeMobileFilters();
            }
        });

        // Authentication button
        document.getElementById('auth-btn').addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.logout();
            } else {
                this.showAuthModal();
            }
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Window resize handler for mobile/desktop view switching
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Close mobile filters if switching to desktop
                if (window.innerWidth > 768) {
                    this.closeMobileFilters();
                }
                // Re-render books to apply correct layout
                this.renderBooks();
            }, 250);
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // Filter size controls
        document.querySelectorAll('input[name="filter-size"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setFilterSize(e.target.value);
            });
        });

        // Book display controls
        document.querySelectorAll('input[name="book-display"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setBookDisplay(e.target.value);
                this.updatePaginationOptions();
            });
        });

        // Initialize pagination options
        this.updatePaginationOptions();

        // Pagination controls
        document.getElementById('prev-page').addEventListener('click', () => {
            this.goToPage(this.currentPage - 1);
        });

        document.getElementById('next-page').addEventListener('click', () => {
            this.goToPage(this.currentPage + 1);
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Initialize dark mode from localStorage
        this.initializeDarkMode();

        // Initialize filter size from localStorage
        this.initializeFilterSize();

        // Initialize book display from localStorage
        this.initializeBookDisplay();

        // Initialize mobile pagination buttons
        this.initializeMobilePagination();

        // Status change handler for date fields
        document.getElementById('book-status').addEventListener('change', (e) => {
            this.handleStatusChange(e.target.value);
        });

        // Star rating functionality
        this.initializeStarRating();

        // Sort control
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;

            // Sync mobile sort options
            document.querySelectorAll('.mobile-sort-option').forEach(btn => {
                if (btn.dataset.sort === e.target.value) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            this.applyFilters();
        });

        // Book card clicks
        document.addEventListener('click', (e) => {
            const bookCard = e.target.closest('.book-card');
            if (bookCard) {
                const isbn = bookCard.dataset.isbn;
                console.log('Clicked book ISBN:', isbn, typeof isbn);
                console.log('Available books:', this.books.map(b => ({ isbn: b.isbn, type: typeof b.isbn, title: b.title })));
                const book = this.books.find(b => b.isbn == isbn); // Use == instead of === for type coercion
                console.log('Found book:', book);
                if (book) {
                    this.showBookDetail(book);
                } else {
                    console.error('Book not found for ISBN:', isbn);
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

        // Series dropdown functionality
        document.getElementById('book-series').addEventListener('change', (e) => {
            this.handleSeriesChange(e.target.value);
        });



        // Authentication form
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthentication();
        });

        // Event delegation for edit and delete buttons in modals
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target, 'Classes:', e.target.classList.toString());

            if (e.target.classList.contains('edit-book-btn')) {
                const isbn = e.target.dataset.isbn;
                const title = e.target.dataset.title;
                const author = e.target.dataset.author;
                console.log('✅ Edit button clicked for ISBN:', isbn, 'Title:', title, 'Author:', author);
                console.log('✅ Authenticated:', this.isAuthenticated);
                this.editBook(isbn, title, author);
            } else if (e.target.classList.contains('delete-book-btn')) {
                const isbn = e.target.dataset.isbn;
                const title = e.target.dataset.title;
                const author = e.target.dataset.author;
                console.log('✅ Delete button clicked for ISBN:', isbn, 'Title:', title, 'Author:', author);
                console.log('✅ Authenticated:', this.isAuthenticated);
                this.deleteBook(isbn, title, author);
            }
        });
    }

    async loadBooks() {
        try {
            if (this.supabase) {
                // Load from Supabase database
                console.log('📚 Loading books from database...');
                const { data, error } = await this.supabase
                    .from('reading_nook')
                    .select('*')
                    .order('date_added', { ascending: false });

                if (error) {
                    throw error;
                }

                // Convert database format to app format
                this.books = data.map(book => this.convertFromDbFormat(book));
                console.log(`✅ Loaded ${this.books.length} books from database`);
                this.showNotification(`Loaded ${this.books.length} books from database`, 'success');
            } else {
                // Fallback to JSON file
                console.log('📚 Loading books from JSON file...');
                const response = await fetch('./data/books.json');
                if (response.ok) {
                    const data = await response.json();
                    this.books = data.books || [];
                    console.log(`✅ Loaded ${this.books.length} books from JSON file`);
                    this.migrateBothFormat();
                } else {
                    console.log('❌ JSON file not found or not accessible');
                    this.books = [];
                }
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Failed to load books from database. Using local data.', 'warning');

            // Fallback to JSON file
            try {
                const response = await fetch('./data/books.json');
                if (response.ok) {
                    const data = await response.json();
                    this.books = data.books || [];
                    this.migrateBothFormat();
                } else {
                    this.books = [];
                }
            } catch (fallbackError) {
                console.log('No fallback data found, starting with empty library');
                this.books = [];
            }
        }

        this.filteredBooks = [...this.books];
        console.log(`📊 Final book count: ${this.books.length}`);
        console.log('📊 Books loaded:', this.books.map(b => ({ title: b.title, isbn: b.isbn })));
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

    // Convert database format to app format
    convertFromDbFormat(dbBook) {
        // Clean and deduplicate format array
        let formats = Array.isArray(dbBook.format) ? dbBook.format : [dbBook.format || 'Physical'];
        formats = [...new Set(formats)].slice(0, 3); // Remove duplicates and limit to 3

        return {
            isbn: dbBook.isbn,
            status: dbBook.status,
            format: formats,
            userRating: dbBook.user_rating || 0,
            dateAdded: dbBook.date_added,
            dateStarted: dbBook.date_started,
            dateFinished: dbBook.date_finished,
            title: dbBook.title,
            author: dbBook.author,
            coverUrl: dbBook.cover_url,
            synopsis: dbBook.synopsis,
            genre: dbBook.genre,
            pageCount: dbBook.page_count,
            datePublished: dbBook.date_published,
            publisher: dbBook.publisher,
            series: dbBook.series || false,
            seriesName: dbBook.series_name || null,
            seriesNumber: dbBook.series_number || null
        };
    }

    // Convert app format to database format
    convertToDbFormat(appBook) {
        // Clean and deduplicate format array before saving
        let formats = Array.isArray(appBook.format) ? appBook.format : [appBook.format];
        formats = [...new Set(formats)].slice(0, 3); // Remove duplicates and limit to 3

        return {
            isbn: appBook.isbn,
            status: appBook.status,
            format: formats,
            user_rating: appBook.userRating || null,
            date_added: appBook.dateAdded,
            date_started: appBook.dateStarted || null,
            date_finished: appBook.dateFinished || null,
            title: appBook.title,
            author: appBook.author,
            cover_url: appBook.coverUrl,
            synopsis: appBook.synopsis,
            genre: appBook.genre,
            page_count: appBook.pageCount,
            date_published: appBook.datePublished,
            publisher: appBook.publisher,
            series: appBook.series || false,
            series_name: appBook.series && appBook.seriesName ? appBook.seriesName : null,
            series_number: appBook.series && appBook.seriesNumber ? parseFloat(appBook.seriesNumber) : null
        };
    }

    initializeFilters() {
        // Initialize all filter categories as collapsed
        const categories = ['status', 'format', 'genre', 'author', 'pageCount', 'publisher', 'rating', 'datePublished', 'yearRead', 'series'];
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
        const filterTypes = ['status', 'format', 'genre', 'author', 'pageCount', 'publisher', 'rating', 'datePublished', 'yearRead', 'series'];

        filterTypes.forEach(type => {
            const checkboxes = document.querySelectorAll(`input[name="${type}"]:checked`);
            this.currentFilters[type] = Array.from(checkboxes).map(cb => cb.value);
        });

        this.applyFilters();
    }

    handleStatusChange(status) {
        const dateStartedRow = document.getElementById('date-started-row');
        const dateFinishedField = document.getElementById('date-finished-field');
        const ratingHint = document.querySelector('.optional-hint');

        // Update rating requirement hint based on status
        if (ratingHint) {
            if (status === 'Finished') {
                ratingHint.textContent = '(Required for finished books)';
                ratingHint.style.color = '#ef4444'; // Red to indicate required
            } else {
                ratingHint.textContent = '(Optional)';
                ratingHint.style.color = '#6b7280'; // Gray to indicate optional
            }
        }

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

        // Reset mobile search input
        const mobileSearchInput = document.getElementById('mobile-search-input');
        if (mobileSearchInput) {
            mobileSearchInput.value = '';
        }

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
            author: [],
            pageCount: [],
            publisher: [],
            rating: [],
            datePublished: [],
            yearRead: [],
            series: []
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

    getFormatTags(formats) {
        // Handle both array and single format for backward compatibility
        const formatArray = Array.isArray(formats) ? formats : [formats];

        return formatArray.map(format => {
            const formatDisplay = format || 'Physical';
            return `<span class="format-tag">${formatDisplay}</span>`;
        }).join('');
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

    // Clean and validate format array
    cleanFormatArray(formats) {
        if (!formats || formats.length === 0) {
            return ['Physical']; // Default format
        }

        // Convert to array if not already
        const formatArray = Array.isArray(formats) ? formats : [formats];

        // Remove duplicates, filter out empty values, and limit to 3
        const cleanedFormats = [...new Set(formatArray)]
            .filter(format => format && format.trim())
            .slice(0, 3);

        // Ensure at least one format
        return cleanedFormats.length > 0 ? cleanedFormats : ['Physical'];
    }

    // Handle series dropdown change
    handleSeriesChange(seriesValue) {
        const seriesFields = document.getElementById('series-fields');
        const seriesName = document.getElementById('series-name');
        const seriesNumber = document.getElementById('series-number');

        if (seriesValue === 'Yes') {
            seriesFields.style.display = 'block';
            seriesName.required = true;
            seriesNumber.required = true;
        } else {
            seriesFields.style.display = 'none';
            seriesName.required = false;
            seriesNumber.required = false;
            seriesName.value = '';
            seriesNumber.value = '';
        }
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

            // Change color based on character count (updated for 1200 char limit)
            if (count > 1100) {
                counter.style.color = '#ef4444'; // Red - approaching limit
            } else if (count > 1000) {
                counter.style.color = '#f59e0b'; // Yellow - getting close
            } else {
                counter.style.color = '#6b7280'; // Gray - plenty of room
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
                const isbnMatch = book.isbn?.toString().toLowerCase().includes(searchTerm);
                const seriesMatch = book.seriesName?.toLowerCase().includes(searchTerm);

                // Handle format search (both array and single format)
                let formatMatch = false;
                if (Array.isArray(book.format)) {
                    formatMatch = book.format.some(f => f.toLowerCase().includes(searchTerm));
                } else if (book.format) {
                    formatMatch = book.format.toLowerCase().includes(searchTerm);
                }

                if (!titleMatch && !authorMatch && !genreMatch && !formatMatch && !isbnMatch && !seriesMatch) return false;
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

            // Author filter
            if (this.currentFilters.author.length > 0 && !this.currentFilters.author.includes(book.author)) {
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

            // Publisher filter
            if (this.currentFilters.publisher.length > 0) {
                if (!book.publisher || !this.currentFilters.publisher.includes(book.publisher)) {
                    return false;
                }
            }

            // Rating filter - exact star matches
            if (this.currentFilters.rating.length > 0) {
                const userRating = book.userRating || 0;
                if (!this.currentFilters.rating.includes(userRating.toString())) {
                    return false;
                }
            }

            // Year Read filter
            if (this.currentFilters.yearRead.length > 0) {
                if (!book.dateFinished) return false;
                const finishYear = new Date(book.dateFinished).getFullYear().toString();
                if (!this.currentFilters.yearRead.includes(finishYear)) {
                    return false;
                }
            }



            // Date Published filter (individual years)
            if (this.currentFilters.datePublished.length > 0) {
                const publishedDate = book.datePublished ? new Date(book.datePublished) : null;
                if (!publishedDate) return false; // Skip books without publication date

                const publishedYear = publishedDate.getFullYear();
                const matchesYear = this.currentFilters.datePublished.some(yearStr => {
                    const filterYear = parseInt(yearStr);
                    return publishedYear === filterYear;
                });
                if (!matchesYear) return false;
            }

            // Series filter
            if (this.currentFilters.series.length > 0) {
                const bookSeriesName = book.seriesName || '';
                const isStandalone = !book.series || !book.seriesName;

                // Check if "Stand Alones" is selected and this is a standalone book
                if (this.currentFilters.series.includes('Stand Alones') && isStandalone) {
                    // This book matches the standalone filter
                } else if (!this.currentFilters.series.includes(bookSeriesName)) {
                    return false;
                }
            }

            return true;
        });

        this.sortBooks();

        // Reset to first page when filters change (unless preserving page)
        if (!this.preserveCurrentPage) {
            this.currentPage = 1;
        }
        this.preserveCurrentPage = false; // Reset flag after use

        this.renderBooks();
        this.updateFilterCounts();
    }

    updateFilterCounts() {
        // Update status filter counts
        const statusCounts = {
            'TBR': this.books.filter(book => book.status === 'TBR').length,
            'Reading': this.books.filter(book => book.status === 'Reading').length,
            'Finished': this.books.filter(book => book.status === 'Finished').length,
            'DNF': this.books.filter(book => book.status === 'DNF').length
        };

        Object.keys(statusCounts).forEach(status => {
            const element = document.querySelector(`input[name="status"][value="${status}"]`);
            if (element) {
                const countSpan = element.parentElement.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = `(${statusCounts[status]})`;
                }
            }
        });

        // Update format filter counts
        const formatCounts = {
            'Physical': this.books.filter(book => {
                const formats = Array.isArray(book.format) ? book.format : [book.format];
                return formats.includes('Physical');
            }).length,
            'Kindle': this.books.filter(book => {
                const formats = Array.isArray(book.format) ? book.format : [book.format];
                return formats.includes('Kindle');
            }).length,
            'Audiobook': this.books.filter(book => {
                const formats = Array.isArray(book.format) ? book.format : [book.format];
                return formats.includes('Audiobook');
            }).length
        };

        Object.keys(formatCounts).forEach(format => {
            const element = document.querySelector(`input[name="format"][value="${format}"]`);
            if (element) {
                const countSpan = element.parentElement.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = `(${formatCounts[format]})`;
                }
            }
        });

        // Update rating filter counts
        for (let rating = 1; rating <= 5; rating++) {
            const count = this.books.filter(book => book.userRating === rating).length;
            const element = document.querySelector(`input[name="rating"][value="${rating}"]`);
            if (element) {
                const countSpan = element.parentElement.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = `(${count})`;
                }
            }
        }

        // Update year read filter counts (dynamic years)
        document.querySelectorAll('input[name="yearRead"]').forEach(checkbox => {
            const year = parseInt(checkbox.value);
            const count = this.books.filter(book => {
                if (!book.dateFinished) return false;
                const finishYear = new Date(book.dateFinished).getFullYear();
                return finishYear === year;
            }).length;

            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });

        // Update genre filter counts
        document.querySelectorAll('input[name="genre"]').forEach(checkbox => {
            const genre = checkbox.value;
            const count = this.books.filter(book => book.genre === genre).length;
            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });

        // Update author filter counts
        document.querySelectorAll('input[name="author"]').forEach(checkbox => {
            const author = checkbox.value;
            const count = this.books.filter(book => book.author === author).length;
            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });

        // Update series filter counts
        document.querySelectorAll('input[name="series"]').forEach(checkbox => {
            const series = checkbox.value;
            let count;

            if (series === 'Stand Alones') {
                count = this.books.filter(book => !book.series || !book.seriesName).length;
            } else {
                count = this.books.filter(book => book.seriesName === series).length;
            }

            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });

        // Update page count filter counts (dynamic ranges)
        document.querySelectorAll('input[name="pageCount"]').forEach(checkbox => {
            const rangeValue = checkbox.value;
            let count = 0;

            if (rangeValue.includes('+')) {
                // Handle "500+" type ranges
                const threshold = parseInt(rangeValue.replace('+', ''));
                count = this.books.filter(book => {
                    if (!book.pageCount) return false;
                    const pages = parseInt(book.pageCount);
                    return pages >= threshold;
                }).length;
            } else if (rangeValue.includes('-')) {
                // Handle "100-200" type ranges
                const [min, max] = rangeValue.split('-').map(n => parseInt(n));
                count = this.books.filter(book => {
                    if (!book.pageCount) return false;
                    const pages = parseInt(book.pageCount);
                    return pages >= min && pages <= max;
                }).length;
            }

            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });



        // Update date published filter counts (individual years)
        document.querySelectorAll('input[name="datePublished"]').forEach(checkbox => {
            const year = parseInt(checkbox.value);
            const count = this.books.filter(book => {
                if (!book.datePublished) return false;
                const bookYear = new Date(book.datePublished).getFullYear();
                return bookYear === year;
            }).length;

            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });

        // Update publisher filter counts
        document.querySelectorAll('input[name="publisher"]').forEach(checkbox => {
            const publisher = checkbox.value;
            const count = this.books.filter(book => book.publisher === publisher).length;
            const countSpan = checkbox.parentElement.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });
    }

    populateSeriesFilter() {
        const seriesContainer = document.getElementById('series-options');
        if (!seriesContainer) return;

        // Get all unique series names from books that are part of a series
        const seriesNames = [...new Set(
            this.books
                .filter(book => book.series && book.seriesName)
                .map(book => book.seriesName)
        )].sort();

        // Check if there are any standalone books
        const hasStandalones = this.books.some(book => !book.series || !book.seriesName);

        // Clear existing options
        seriesContainer.innerHTML = '';

        // Add Stand Alones option if there are standalone books
        if (hasStandalones) {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'series';
            checkbox.value = 'Stand Alones';
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = 'Stand Alones <span class="filter-count">(0)</span>';

            label.appendChild(checkbox);
            label.appendChild(span);
            seriesContainer.appendChild(label);
        }

        // Add series options
        seriesNames.forEach(seriesName => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'series';
            checkbox.value = seriesName;
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${seriesName} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            seriesContainer.appendChild(label);
        });
    }

    populateAuthorFilter() {
        const authorContainer = document.getElementById('author-options');
        if (!authorContainer) return;

        // Get all unique authors from books and sort by last name
        const authors = [...new Set(
            this.books
                .filter(book => book.author)
                .map(book => book.author)
        )].sort((a, b) => {
            // Extract last names for sorting
            const lastNameA = a.split(' ').pop().toLowerCase();
            const lastNameB = b.split(' ').pop().toLowerCase();
            return lastNameA.localeCompare(lastNameB);
        });

        // Clear existing options
        authorContainer.innerHTML = '';

        // Add author options
        authors.forEach(author => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'author';
            checkbox.value = author;
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${author} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            authorContainer.appendChild(label);
        });
    }

    populateYearReadFilter() {
        const yearContainer = document.getElementById('yearRead-options');
        if (!yearContainer) return;

        // Get all unique years from books that have been finished
        const years = [...new Set(
            this.books
                .filter(book => book.dateFinished)
                .map(book => {
                    const finishDate = new Date(book.dateFinished);
                    return finishDate.getFullYear();
                })
                .filter(year => !isNaN(year)) // Filter out invalid years
        )].sort((a, b) => b - a); // Sort in descending order (newest first)

        // Clear existing options
        yearContainer.innerHTML = '';

        // If no years found, show a message
        if (years.length === 0) {
            yearContainer.innerHTML = '<p class="no-options">No books finished yet</p>';
            return;
        }

        // Add year options
        years.forEach(year => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'yearRead';
            checkbox.value = year.toString();
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${year} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            yearContainer.appendChild(label);
        });
    }

    populatePageCountFilter() {
        const pageCountContainer = document.getElementById('pageCount-options');
        if (!pageCountContainer) return;

        // Get all page counts from books
        const pageCounts = this.books
            .filter(book => book.pageCount && !isNaN(book.pageCount))
            .map(book => parseInt(book.pageCount));

        console.log('📊 Page counts found:', pageCounts);

        if (pageCounts.length === 0) {
            pageCountContainer.innerHTML = '<p class="no-options">No page count data available</p>';
            return;
        }

        // Find the maximum page count
        const maxPages = Math.max(...pageCounts);
        console.log('📊 Max pages:', maxPages);

        // Create 100-page increment ranges
        const ranges = [];

        // Start from 1 and go up in 100-page increments
        let currentStart = 1;

        while (currentStart <= maxPages) {
            let currentEnd = currentStart + 99;

            // For the last range, if it would go beyond maxPages significantly, make it a "+" range
            if (currentStart > maxPages) break;

            // Check if any books fall in this range
            const booksInRange = pageCounts.filter(pages => pages >= currentStart && pages <= currentEnd);
            console.log(`📊 Range ${currentStart}-${currentEnd}: ${booksInRange.length} books`, booksInRange);

            if (booksInRange.length > 0) {
                // If this is a high range and there are few books, make it a "+" range
                if (currentStart >= 800 && currentEnd > maxPages) {
                    ranges.push({
                        value: `${currentStart}+`,
                        label: `${currentStart}+ pages`
                    });
                    break;
                } else {
                    ranges.push({
                        value: `${currentStart}-${currentEnd}`,
                        label: `${currentStart}-${currentEnd} pages`
                    });
                }
            }

            currentStart += 100;
        }

        // Clear existing options
        pageCountContainer.innerHTML = '';

        console.log('📊 Final page count ranges:', ranges);

        // Add page count options
        ranges.forEach(range => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'pageCount';
            checkbox.value = range.value;
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${range.label} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            pageCountContainer.appendChild(label);
        });
    }

    populateGenreFilter() {
        const genreContainer = document.getElementById('genre-options');
        if (!genreContainer) return;

        // Get all unique genres from books
        const genres = [...new Set(
            this.books
                .filter(book => book.genre && book.genre.trim())
                .map(book => book.genre.trim())
        )].sort();

        // Clear existing options
        genreContainer.innerHTML = '';

        // Add genre options
        genres.forEach(genre => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'genre';
            checkbox.value = genre;
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${genre} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            genreContainer.appendChild(label);
        });
    }

    populatePublisherFilter() {
        const publisherContainer = document.getElementById('publisher-options');
        if (!publisherContainer) return;

        // Get all unique publishers from books
        const publishers = [...new Set(
            this.books
                .filter(book => book.publisher && book.publisher.trim())
                .map(book => book.publisher.trim())
        )].sort();

        // Clear existing options
        publisherContainer.innerHTML = '';

        // Add publisher options
        publishers.forEach(publisher => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'publisher';
            checkbox.value = publisher;
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${publisher} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            publisherContainer.appendChild(label);
        });
    }

    populateDatePublishedFilter() {
        const datePublishedContainer = document.getElementById('datePublished-options');
        if (!datePublishedContainer) return;

        // Get all unique publication years from books
        const publicationYears = [...new Set(
            this.books
                .filter(book => book.datePublished)
                .map(book => {
                    const pubDate = new Date(book.datePublished);
                    return pubDate.getFullYear();
                })
                .filter(year => !isNaN(year) && year > 1000) // Filter out invalid years
        )].sort((a, b) => b - a); // Sort in descending order (newest first)

        if (publicationYears.length === 0) {
            datePublishedContainer.innerHTML = '<p class="no-options">No publication date data available</p>';
            return;
        }

        // Clear existing options
        datePublishedContainer.innerHTML = '';

        // Add individual year options
        publicationYears.forEach(year => {
            const label = document.createElement('label');
            label.className = 'filter-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'datePublished';
            checkbox.value = year.toString();
            checkbox.addEventListener('change', () => this.updateFilters());

            const span = document.createElement('span');
            span.innerHTML = `${year} <span class="filter-count">(0)</span>`;

            label.appendChild(checkbox);
            label.appendChild(span);
            datePublishedContainer.appendChild(label);
        });
    }

    sortBooks() {
        const [field, ...directionParts] = this.currentSort.split('-');
        const direction = directionParts.join('-'); // Handle multi-part directions like 'series-asc'

        this.filteredBooks.sort((a, b) => {
            // Special handling for author-series sorting
            if (field === 'author' && direction === 'series-asc') {
                // Helper function to extract last name from author
                const getLastName = (author) => {
                    if (!author) return '';
                    const parts = author.trim().split(' ');
                    return parts[parts.length - 1].toLowerCase();
                };

                // 1. First sort by author's last name
                const aLastName = getLastName(a.author);
                const bLastName = getLastName(b.author);

                if (aLastName !== bLastName) {
                    return aLastName.localeCompare(bLastName);
                }

                // 2. If same last name, sort by full author name
                const aAuthor = (a.author || '').toLowerCase();
                const bAuthor = (b.author || '').toLowerCase();

                if (aAuthor !== bAuthor) {
                    return aAuthor.localeCompare(bAuthor);
                }

                // 3. If same author, handle series vs non-series books
                const aIsSeries = a.series && a.seriesName;
                const bIsSeries = b.series && b.seriesName;

                if (aIsSeries && bIsSeries) {
                    // Both are series books - sort by series name first
                    const aSeriesName = a.seriesName.toLowerCase();
                    const bSeriesName = b.seriesName.toLowerCase();

                    if (aSeriesName !== bSeriesName) {
                        return aSeriesName.localeCompare(bSeriesName);
                    }

                    // Same series - sort by series number
                    const aSeriesNumber = parseFloat(a.seriesNumber) || 0;
                    const bSeriesNumber = parseFloat(b.seriesNumber) || 0;

                    if (aSeriesNumber !== bSeriesNumber) {
                        return aSeriesNumber - bSeriesNumber;
                    }
                } else if (aIsSeries && !bIsSeries) {
                    // Series books come before standalone books for same author
                    return -1;
                } else if (!aIsSeries && bIsSeries) {
                    // Standalone books come after series books for same author
                    return 1;
                }

                // 4. Final fallback: sort by book title
                const aTitle = (a.title || '').toLowerCase();
                const bTitle = (b.title || '').toLowerCase();
                return aTitle.localeCompare(bTitle);
            }

            // If series filter is active, prioritize series sorting for other sort types
            if (this.currentFilters.series.length > 0) {
                // First sort by series name
                const aSeriesName = a.seriesName || '';
                const bSeriesName = b.seriesName || '';

                if (aSeriesName !== bSeriesName) {
                    return aSeriesName.localeCompare(bSeriesName);
                }

                // If same series, sort by series number
                const aSeriesNumber = parseFloat(a.seriesNumber) || 0;
                const bSeriesNumber = parseFloat(b.seriesNumber) || 0;

                if (aSeriesNumber !== bSeriesNumber) {
                    return aSeriesNumber - bSeriesNumber;
                }
            }

            let aValue, bValue;

            switch (field) {
                case 'title':
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
                    break;
                case 'author':
                    // For regular author sorting, also maintain series order
                    const getLastName = (author) => {
                        if (!author) return '';
                        const parts = author.trim().split(' ');
                        return parts[parts.length - 1].toLowerCase();
                    };

                    const aLastName = getLastName(a.author);
                    const bLastName = getLastName(b.author);

                    if (aLastName !== bLastName) {
                        aValue = aLastName;
                        bValue = bLastName;
                        break;
                    }

                    // Same author - check if both are in series
                    const aIsSeries = a.series && a.seriesName;
                    const bIsSeries = b.series && b.seriesName;

                    if (aIsSeries && bIsSeries && a.seriesName === b.seriesName) {
                        // Same series - sort by series number
                        const aSeriesNumber = parseFloat(a.seriesNumber) || 0;
                        const bSeriesNumber = parseFloat(b.seriesNumber) || 0;
                        aValue = aSeriesNumber;
                        bValue = bSeriesNumber;
                        break;
                    } else if (aIsSeries && bIsSeries) {
                        // Different series - sort by series name
                        aValue = a.seriesName.toLowerCase();
                        bValue = b.seriesName.toLowerCase();
                        break;
                    } else if (aIsSeries && !bIsSeries) {
                        // Series books come before standalone books
                        return direction === 'asc' ? -1 : 1;
                    } else if (!aIsSeries && bIsSeries) {
                        // Standalone books come after series books
                        return direction === 'asc' ? 1 : -1;
                    }

                    // Both standalone or fallback to title
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
                    break;

                case 'dateAdded':
                    aValue = new Date(a.dateAdded || 0);
                    bValue = new Date(b.dateAdded || 0);
                    break;
                case 'datePublished':
                    aValue = new Date(a.datePublished || 0);
                    bValue = new Date(b.datePublished || 0);
                    break;
                case 'dateStarted':
                    aValue = new Date(a.dateStarted || 0);
                    bValue = new Date(b.dateStarted || 0);
                    break;
                case 'dateFinished':
                    aValue = new Date(a.dateFinished || 0);
                    bValue = new Date(b.dateFinished || 0);
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
        const bookCountElement = document.getElementById('book-count');

        // Get current display mode
        const isListView = bookshelf && bookshelf.classList.contains('book-display-list');
        const booksPerPage = isListView ? this.booksPerPage.list : this.booksPerPage.grid;

        // Calculate pagination
        const totalFiltered = this.filteredBooks.length;
        const totalPages = Math.ceil(totalFiltered / booksPerPage);

        // Ensure current page is valid
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        // Calculate start and end indices for current page
        const startIndex = (this.currentPage - 1) * booksPerPage;
        const endIndex = Math.min(startIndex + booksPerPage, totalFiltered);
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);

        // Update book count display
        if (bookCountElement) {
            if (totalFiltered === 0) {
                bookCountElement.textContent = 'Showing 0 books';
            } else {
                bookCountElement.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalFiltered} book${totalFiltered !== 1 ? 's' : ''}`;
            }
        }

        // Handle empty state
        if (totalFiltered === 0) {
            bookshelf.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            this.updatePagination(0);
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        // Render books for current page
        bookshelf.innerHTML = booksToShow.map(book => this.createBookCard(book)).join('');

        // Update pagination controls
        this.updatePagination(totalPages);
    }

    createBookCard(book) {
        const bookshelf = document.querySelector('.bookshelf');
        const isListView = bookshelf && bookshelf.classList.contains('book-display-list');

        if (isListView) {
            return this.createListViewCard(book);
        } else {
            return this.createGridViewCard(book);
        }
    }

    createGridViewCard(book) {
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

    createListViewCard(book) {
        const coverUrl = book.coverUrl || '';
        const rating = book.user_rating || book.userRating || book.rating || 0;

        // Check if mobile view (screen width <= 768px)
        const isMobile = window.innerWidth <= 768;

        // Series info
        const seriesInfo = book.series && book.series !== 'No' && book.seriesName ?
            `${book.seriesName} #${book.seriesNumber || '?'}` : '';

        // Mobile simplified view
        if (isMobile) {
            return `
                <div class="book-card" data-isbn="${book.isbn}">
                    <div class="book-cover-container">
                        ${coverUrl ?
                            `<img src="${coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">` :
                            `<div class="book-cover-placeholder">No Cover</div>`
                        }
                    </div>
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">by ${book.author}</div>
                        ${seriesInfo ? `<div class="book-series-info">${seriesInfo}</div>` : ''}
                        <div class="book-tags-mobile">
                            <span class="badge status-${book.status?.toLowerCase() || 'tbr'}">${book.status || 'TBR'}</span>
                            ${this.getFormatBadges(book.format)}
                        </div>
                        <div class="book-rating">
                            ${rating > 0 ?
                                `<div class="stars">${this.generateStars(rating)}</div>` :
                                `<div class="no-rating">Not Rated</div>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        // Desktop full view
        const seriesInfoBadge = book.series && book.series !== 'No' && book.seriesName ?
            `<span class="series-badge">${book.seriesName} #${book.seriesNumber || '?'}</span>` : '';
        const synopsis = book.synopsis || book.description || '';
        const truncatedSynopsis = synopsis.length > 500 ? synopsis.substring(0, 500) + '...' : synopsis;
        return `
            <div class="book-card" data-isbn="${book.isbn}">
                <div class="book-cover-container">
                    ${coverUrl ?
                        `<img src="${coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">` :
                        `<div class="book-cover-placeholder">No Cover</div>`
                    }
                </div>
                <div class="book-info">
                    <div class="book-title-author">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">by ${book.author}</div>
                        ${seriesInfoBadge ? `<div class="book-series-info">${seriesInfoBadge}</div>` : ''}
                    </div>
                    <div class="book-synopsis">${truncatedSynopsis}</div>
                    <div class="book-rating-section">
                        <div class="book-rating-list">
                            ${rating > 0 ?
                                `<div class="stars">${this.generateStars(rating)}</div>` :
                                `<div class="no-rating">Not Rated</div>`
                            }
                        </div>
                        <div class="book-tags">
                            <span class="badge status-${book.status?.toLowerCase() || 'tbr'}">${book.status || 'TBR'}</span>
                            ${this.getFormatBadges(book.format)}
                        </div>
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

    async updateStats() {
        await this.updateStatsWithLocalData();
    }



    async updateStatsWithLocalData() {
        const totalBooks = this.books.length;
        const finishedBooks = this.books.filter(book => book.status === 'Finished').length;
        const currentlyReading = this.books.filter(book => book.status === 'Reading').length;
        const toBeRead = this.books.filter(book => book.status === 'TBR').length;
        const dnfBooks = this.books.filter(book => book.status === 'DNF').length;

        // Calculate pages for different categories
        const totalPages = this.books.reduce((sum, book) => sum + (book.pageCount || 0), 0);




        // Calculate books read this year (more robust date checking)
        const currentYear = new Date().getFullYear();
        const booksThisYear = this.books.filter(book => {
            if (book.status !== 'Finished' || !book.dateFinished) return false;

            // Handle different date formats
            const finishDate = new Date(book.dateFinished);
            return finishDate.getFullYear() === currentYear;
        }).length;

        // Calculate average rating for ALL books with ratings (not just finished)
        // Check both userRating (camelCase) and user_rating (database field)
        const ratedBooks = this.books.filter(book => {
            const rating = book.user_rating || book.userRating || book.rating;
            return rating && rating > 0;
        });

        const averageRating = ratedBooks.length > 0
            ? (ratedBooks.reduce((sum, book) => {
                const rating = book.user_rating || book.userRating || book.rating;
                return sum + rating;
            }, 0) / ratedBooks.length).toFixed(1)
            : 0;

        const stats = {
            total_books: totalBooks,
            finished_books: finishedBooks,
            currently_reading: currentlyReading,
            to_be_read: toBeRead,
            dnf_books: dnfBooks,
            total_pages: totalPages,
            books_this_year: booksThisYear,
            average_rating: averageRating
        };

        this.updateOverallStatsDisplay(stats);
    }

    updateOverallStatsDisplay(stats) {
        // Update statistics modal elements - only update elements that exist
        const elements = {
            'total-books': stats.total_books || 0,
            'books-read': stats.finished_books || 0,
            'currently-reading': stats.currently_reading || 0,
            'to-be-read': stats.to_be_read || 0,
            'dnf-books': stats.dnf_books || 0,
            'total-pages': (stats.total_pages || 0).toLocaleString(),
            'average-rating': stats.average_rating > 0 ? `${stats.average_rating}⭐` : 'N/A'
        };

        // Update each element if it exists
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
                console.log(`Updated ${id}: ${elements[id]}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
    }

    showBookDetail(book) {
        const modal = document.getElementById('book-modal');
        const modalBody = modal.querySelector('.modal-body');

        // Reset scroll position to top
        modalBody.scrollTop = 0;

        const userStars = this.generateStars(book.userRating || 0);

        modalBody.innerHTML = `
            <div class="book-detail">
                <div class="book-detail-cover-container">
                    ${book.coverUrl ?
                        `<img src="${book.coverUrl}" alt="${book.title}" class="book-detail-cover">` :
                        `<div class="book-cover-placeholder" style="width: 200px; height: 300px;">No Cover Available</div>`
                    }
                    ${book.dateStarted || book.dateFinished || (book.currentPage && book.currentPage > 0) ? `
                    <div class="cover-reading-info">
                        ${book.dateStarted || book.dateFinished ? `
                        <div class="reading-dates">
                            ${book.dateStarted ? `Started: ${new Date(book.dateStarted).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}` : ''}
                            ${book.dateStarted && book.dateFinished ? '<br>' : ''}
                            ${book.dateFinished ? `Finished: ${new Date(book.dateFinished).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}` : ''}
                        </div>
                        ` : ''}
                        ${book.currentPage && book.currentPage > 0 ? `
                        <div class="current-page-info">
                            Current Page: ${book.currentPage} of ${book.pageCount || 0}
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
                <div class="book-detail-info">
                    <div class="title-with-badges">
                        <h3>${book.title || 'Unknown Title'}</h3>
                        <div class="title-badges">
                            <span class="badge status-${book.status?.toLowerCase() || 'tbr'}">${book.status || 'TBR'}</span>
                            ${this.getFormatBadges(book.format)}
                        </div>
                    </div>
                    <p class="book-detail-author">by ${book.author || 'Unknown Author'}</p>

                    ${book.series ? `
                        <div class="book-series-info">
                            <span class="series-badge">${book.seriesName} #${book.seriesNumber}</span>
                        </div>
                    ` : ''}

                    <div class="book-ratings">
                        <div class="rating-item">
                            <span class="rating-label">My Rating:</span>
                            ${(book.userRating || 0) > 0 ?
                                `<div class="stars">${userStars}</div>` :
                                `<span class="no-rating-text">Not Rated</span>`
                            }
                        </div>
                    </div>

                    ${book.synopsis ? `
                        <div class="book-synopsis">
                            <h4>Synopsis</h4>
                            <p>${book.synopsis}</p>
                        </div>
                    ` : ''}

                    <div class="book-detail-meta">
                        <div class="meta-item">
                            <div class="meta-label">Pages</div>
                            <div class="meta-value">${book.pageCount || 0}</div>
                        </div>
                        ${book.isbn ? `
                        <div class="meta-item">
                            <div class="meta-label">ISBN-13</div>
                            <div class="meta-value">${book.isbn}</div>
                        </div>
                        ` : ''}

                        <div class="meta-item">
                            <div class="meta-label">Genre</div>
                            <div class="meta-value">${book.genre || 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Date Published</div>
                            <div class="meta-value">${book.datePublished ? new Date(book.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</div>
                        </div>
                        ${book.publisher ? `
                        <div class="meta-item">
                            <div class="meta-label">Publisher</div>
                            <div class="meta-value">${book.publisher}</div>
                        </div>
                        ` : ''}
                    </div>



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
                        <button class="btn-secondary edit-book-btn"
                                data-isbn="${book.isbn}"
                                data-title="${book.title}"
                                data-author="${book.author}">Edit Book</button>
                        <button class="btn-danger delete-book-btn"
                                data-isbn="${book.isbn}"
                                data-title="${book.title}"
                                data-author="${book.author}">Remove Book</button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

        // Make this instance available globally for modal interactions
        window.bookshelf = this;
    }

    toggleMobileFilters() {
        const sidebar = document.querySelector('.filters-sidebar');
        sidebar.classList.toggle('mobile-open');
    }

    closeMobileFilters() {
        const sidebar = document.querySelector('.filters-sidebar');
        sidebar.classList.remove('mobile-open');
    }

    toggleAuthCollapse() {
        const toggleBtn = document.getElementById('mobile-auth-toggle');
        const authContent = document.getElementById('mobile-auth-content');

        toggleBtn.classList.toggle('collapsed');
        authContent.classList.toggle('collapsed');
    }

    toggleSortCollapse() {
        const toggleBtn = document.getElementById('mobile-sort-toggle');
        const sortContent = document.getElementById('mobile-sort-content');

        toggleBtn.classList.toggle('collapsed');
        sortContent.classList.toggle('collapsed');
    }

    toggleFiltersCollapse() {
        const toggleBtn = document.getElementById('mobile-filters-toggle');
        const filtersContent = document.getElementById('filters-content');

        toggleBtn.classList.toggle('collapsed');
        filtersContent.classList.toggle('collapsed');
    }

    toggleSettingsCollapse() {
        const toggleBtn = document.getElementById('mobile-settings-toggle');
        const settingsContent = document.getElementById('mobile-settings-content');

        toggleBtn.classList.toggle('collapsed');
        settingsContent.classList.toggle('collapsed');
    }

    initializeMobilePagination() {
        const currentGridCount = this.booksPerPage.grid;

        // Update active state for mobile pagination buttons
        document.querySelectorAll('.mobile-pagination-btn').forEach(btn => {
            const count = parseInt(btn.dataset.count);
            if (count === currentGridCount) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    openMobileSearch() {
        const modal = document.getElementById('mobile-search-modal');
        const input = document.getElementById('mobile-search-input');

        modal.classList.remove('hidden');

        // Set current search value
        input.value = this.currentFilters.search || '';

        // Focus input after a short delay to ensure modal is visible
        setTimeout(() => {
            input.focus();
        }, 100);
    }

    closeMobileSearch() {
        const modal = document.getElementById('mobile-search-modal');
        modal.classList.add('hidden');
    }

    handleSearch(query) {
        this.currentFilters.search = query.toLowerCase();
        this.currentPage = 1;
        this.applyFilters();

        // Update desktop search input if it exists
        const desktopSearchInput = document.getElementById('search-input');
        if (desktopSearchInput && desktopSearchInput.value !== query) {
            desktopSearchInput.value = query;
        }
    }

    showAddBookModal() {
        if (!this.isAuthenticated) {
            this.showNotification('Please go to Settings to authenticate before adding books', 'warning');
            return;
        }

        document.getElementById('add-book-modal').classList.remove('hidden');
        // Initialize date fields based on default status (TBR)
        this.handleStatusChange('TBR');
        // Initialize series fields based on default value (No)
        this.handleSeriesChange('No');
    }

    async showStatisticsModal() {
        document.getElementById('statistics-modal').classList.remove('hidden');
        // Update statistics when modal opens to ensure fresh data
        await this.updateStats();
    }

    showSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    showAuthModal() {
        document.getElementById('auth-modal').classList.remove('hidden');
    }

    handleAuthentication() {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const errorDiv = document.getElementById('auth-error');

        // Check if config file is loaded
        if (!window.CONFIG || !window.CONFIG.AUTH_CREDENTIALS) {
            errorDiv.textContent = 'Configuration file missing. Please copy config.example.js to config.js and update with your credentials.';
            errorDiv.classList.remove('hidden');
            document.getElementById('auth-password').value = '';
            this.showNotification('Config file missing. Check config.example.js for setup instructions.', 'warning');
            return;
        }

        // Get credentials from config file only
        const validCredentials = window.CONFIG.AUTH_CREDENTIALS;

        const isValid = validCredentials.some(cred =>
            cred.username === username && cred.password === password
        );

        if (isValid) {
            this.isAuthenticated = true;
            this.updateAuthStatus();
            this.showNotification('Authentication successful!', 'success');

            // Clear form fields
            document.getElementById('auth-username').value = '';
            document.getElementById('auth-password').value = '';
            errorDiv.classList.add('hidden');
        } else {
            errorDiv.textContent = 'Invalid username or password.';
            errorDiv.classList.remove('hidden');
            // Clear password field for security
            document.getElementById('auth-password').value = '';
            document.getElementById('auth-password').focus();
        }
    }

    authenticate(username, password, isMobile = false) {
        const errorDiv = isMobile ? document.getElementById('mobile-auth-error') : document.getElementById('auth-error');

        // Check if config file is loaded
        if (!window.CONFIG || !window.CONFIG.AUTH_CREDENTIALS) {
            errorDiv.textContent = 'Configuration file missing. Please copy config.example.js to config.js and update with your credentials.';
            errorDiv.classList.remove('hidden');
            if (isMobile) {
                document.getElementById('mobile-auth-password').value = '';
            } else {
                document.getElementById('auth-password').value = '';
            }
            this.showNotification('Config file missing. Check config.example.js for setup instructions.', 'warning');
            return;
        }

        // Get credentials from config file only
        const validCredentials = window.CONFIG.AUTH_CREDENTIALS;

        const isValid = validCredentials.some(cred =>
            cred.username === username && cred.password === password
        );

        if (isValid) {
            this.isAuthenticated = true;
            this.updateAuthStatus();
            this.showNotification('Authentication successful!', 'success');

            // Clear form fields
            if (isMobile) {
                document.getElementById('mobile-auth-username').value = '';
                document.getElementById('mobile-auth-password').value = '';
            } else {
                document.getElementById('auth-username').value = '';
                document.getElementById('auth-password').value = '';
            }
            errorDiv.classList.add('hidden');
        } else {
            errorDiv.textContent = 'Invalid username or password.';
            errorDiv.classList.remove('hidden');
            // Clear password field for security
            if (isMobile) {
                document.getElementById('mobile-auth-password').value = '';
                document.getElementById('mobile-auth-password').focus();
            } else {
                document.getElementById('auth-password').value = '';
                document.getElementById('auth-password').focus();
            }
        }
    }

    logout(isMobile = false) {
        this.isAuthenticated = false;
        this.updateAuthStatus();

        // Clear form fields
        if (isMobile) {
            document.getElementById('mobile-auth-username').value = '';
            document.getElementById('mobile-auth-password').value = '';
            document.getElementById('mobile-auth-error').classList.add('hidden');
        } else {
            document.getElementById('auth-username').value = '';
            document.getElementById('auth-password').value = '';
            document.getElementById('auth-error').classList.add('hidden');
        }

        this.showNotification('Logged out successfully', 'info');
    }

    updateAuthStatus() {
        const statusText = document.getElementById('auth-status-text');
        const logoutBtn = document.getElementById('logout-btn');
        const authFormContainer = document.getElementById('auth-form-container');
        const authBtn = document.getElementById('auth-btn');

        // Mobile auth elements
        const mobileAuthToggle = document.getElementById('mobile-auth-toggle');
        const mobileAuthStatusText = document.getElementById('mobile-auth-status-text');
        const mobileAuthFormContainer = document.getElementById('mobile-auth-form-container');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        if (this.isAuthenticated) {
            statusText.textContent = 'Authenticated';
            statusText.style.color = '#059669';
            logoutBtn.classList.remove('hidden');
            if (authFormContainer) authFormContainer.classList.add('hidden');

            // Update header button
            authBtn.textContent = 'Logout';
            authBtn.classList.add('authenticated');

            // Update mobile auth section
            if (mobileAuthToggle) {
                mobileAuthToggle.querySelector('.menu-text').textContent = 'Logout';
                mobileAuthToggle.classList.add('authenticated');
            }
            if (mobileAuthStatusText) {
                mobileAuthStatusText.textContent = 'Authenticated';
                mobileAuthStatusText.style.color = '#059669';
            }
            if (mobileAuthFormContainer) {
                mobileAuthFormContainer.classList.add('hidden');
            }
            if (mobileLogoutBtn) {
                mobileLogoutBtn.classList.remove('hidden');
            }
        } else {
            statusText.textContent = 'Not Authenticated';
            statusText.style.color = 'var(--text-secondary)';
            logoutBtn.classList.add('hidden');
            if (authFormContainer) authFormContainer.classList.remove('hidden');

            // Update header button
            authBtn.textContent = 'Authenticate';
            authBtn.classList.remove('authenticated');

            // Update mobile auth section
            if (mobileAuthToggle) {
                mobileAuthToggle.querySelector('.menu-text').textContent = 'Authenticate';
                mobileAuthToggle.classList.remove('authenticated');
            }
            if (mobileAuthStatusText) {
                mobileAuthStatusText.textContent = 'Not Authenticated';
                mobileAuthStatusText.style.color = 'var(--text-secondary)';
            }
            if (mobileAuthFormContainer) {
                mobileAuthFormContainer.classList.remove('hidden');
            }
            if (mobileLogoutBtn) {
                mobileLogoutBtn.classList.add('hidden');
            }
        }
    }

    initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const toggle = document.getElementById('dark-mode-toggle');
        const mobileToggle = document.getElementById('mobile-dark-mode-toggle');

        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.checked = true;
            if (mobileToggle) mobileToggle.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggle.checked = false;
            if (mobileToggle) mobileToggle.checked = false;
        }
    }

    toggleDarkMode(isDark) {
        const toggle = document.getElementById('dark-mode-toggle');
        const mobileToggle = document.getElementById('mobile-dark-mode-toggle');

        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
            toggle.checked = true;
            if (mobileToggle) mobileToggle.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
            toggle.checked = false;
            if (mobileToggle) mobileToggle.checked = false;
        }
    }

    initializeFilterSize() {
        const filterSize = localStorage.getItem('filterSize') || 'small';
        const radio = document.querySelector(`input[name="filter-size"][value="${filterSize}"]`);

        if (radio) {
            radio.checked = true;
        }

        this.setFilterSize(filterSize);
    }

    setFilterSize(size) {
        const sidebar = document.querySelector('.filters-sidebar');

        // Remove existing size classes
        sidebar.classList.remove('filter-size-small', 'filter-size-medium', 'filter-size-large');

        // Add new size class
        sidebar.classList.add(`filter-size-${size}`);

        // Save to localStorage
        localStorage.setItem('filterSize', size);
    }

    initializeBookDisplay() {
        // Force grid view on mobile
        const isMobile = window.innerWidth <= 768;
        const bookDisplay = isMobile ? 'default' : (localStorage.getItem('bookDisplay') || 'default');
        const radio = document.querySelector(`input[name="book-display"][value="${bookDisplay}"]`);

        if (radio) {
            radio.checked = true;
        }

        this.setBookDisplay(bookDisplay);
    }

    setBookDisplay(display) {
        const bookshelf = document.querySelector('.bookshelf');

        // Force grid view on mobile (screen width <= 768px)
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            display = 'default'; // Force grid view on mobile
        }

        // Remove existing display classes
        bookshelf.classList.remove('book-display-default', 'book-display-list');

        // Add new display class
        bookshelf.classList.add(`book-display-${display}`);

        // Save to localStorage (only if not mobile)
        if (!isMobile) {
            localStorage.setItem('bookDisplay', display);
        }

        // Reset to first page when changing display mode
        this.currentPage = 1;

        // Re-render books to apply list view if needed
        this.renderBooks();
    }

    updatePaginationOptions() {
        const isListView = document.querySelector('input[name="book-display"]:checked').value === 'list';
        const title = document.getElementById('pagination-setting-title');
        const container = document.getElementById('pagination-options');

        // Update title
        title.textContent = isListView ? 'Books Per Page (List)' : 'Books Per Page (Grid)';

        // Clear existing options
        container.innerHTML = '';

        // Get current setting from localStorage
        const currentSetting = localStorage.getItem(`booksPerPage_${isListView ? 'list' : 'grid'}`) ||
                              (isListView ? '20' : '40');

        // Generate options based on view type
        const options = isListView ?
            [10, 15, 20, 25, 30] : // List: 10, 15, 20, 25, 30
            [10, 20, 30, 40, 50];  // Grid: 10, 20, 30, 40, 50

        options.forEach((count) => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `books-per-page-${count}`;
            input.name = 'books-per-page';
            input.value = count;
            input.checked = count.toString() === currentSetting;

            const label = document.createElement('label');
            label.htmlFor = `books-per-page-${count}`;
            label.className = 'size-option';
            label.textContent = count.toString();

            input.addEventListener('change', () => {
                if (input.checked) {
                    this.setBooksPerPage(count);
                }
            });

            container.appendChild(input);
            container.appendChild(label);
        });
    }

    setBooksPerPage(count) {
        const isListView = document.querySelector('input[name="book-display"]:checked').value === 'list';
        const viewType = isListView ? 'list' : 'grid';

        // Update the setting
        this.booksPerPage[viewType] = count;

        // Save to localStorage
        localStorage.setItem(`booksPerPage_${viewType}`, count.toString());

        // Reset to first page and re-render
        this.currentPage = 1;
        this.renderBooks();
    }

    updatePagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        // Show/hide pagination based on whether we need it
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        // Update prev/next buttons
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;

        // Generate page numbers
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = '';

        // Always show first page
        if (totalPages >= 1) {
            this.addPageNumber(1, pageNumbers);
        }

        // Add ellipsis and pages around current page if needed
        if (totalPages > 7) {
            if (this.currentPage > 4) {
                this.addEllipsis(pageNumbers);
            }

            // Show pages around current page
            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(totalPages - 1, this.currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    this.addPageNumber(i, pageNumbers);
                }
            }

            if (this.currentPage < totalPages - 3) {
                this.addEllipsis(pageNumbers);
            }
        } else {
            // Show all pages if 7 or fewer
            for (let i = 2; i < totalPages; i++) {
                this.addPageNumber(i, pageNumbers);
            }
        }

        // Always show last page if more than 1 page
        if (totalPages > 1) {
            this.addPageNumber(totalPages, pageNumbers);
        }
    }

    addPageNumber(pageNum, container) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${pageNum === this.currentPage ? 'active' : ''}`;
        pageBtn.textContent = pageNum;
        pageBtn.addEventListener('click', () => this.goToPage(pageNum));
        container.appendChild(pageBtn);
    }

    addEllipsis(container) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '...';
        container.appendChild(ellipsis);
    }

    goToPage(pageNum) {
        const isListView = document.querySelector('.bookshelf').classList.contains('book-display-list');
        const booksPerPage = isListView ? this.booksPerPage.list : this.booksPerPage.grid;
        const totalPages = Math.ceil(this.filteredBooks.length / booksPerPage);

        if (pageNum >= 1 && pageNum <= totalPages) {
            this.currentPage = pageNum;
            this.renderBooks();

            // Scroll to top when changing pages
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    closeModals(clearEditingState = true) {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });

        // Only reset form if we're not preserving editing state
        if (clearEditingState) {
            // Reset add book form
            document.getElementById('add-book-form').reset();

            // Clear format checkboxes to prevent accumulation
            document.querySelectorAll('input[name="format"]').forEach(cb => {
                cb.checked = false;
            });

            // Reset form title and button text
            const addModal = document.getElementById('add-book-modal');
            const title = addModal.querySelector('h2');
            const submitBtn = addModal.querySelector('button[type="submit"]');

            title.textContent = 'Add New Book';
            submitBtn.textContent = 'Add Book';

            // Clear all form fields
            document.getElementById('book-image-url').value = '';
            document.getElementById('book-isbn').value = '';
            document.getElementById('book-publisher').value = '';
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

            // Reset series fields
            document.getElementById('book-series').value = 'No';
            document.getElementById('series-name').value = '';
            document.getElementById('series-number').value = '';
            this.handleSeriesChange('No');

            // Clear editing state
            this.editingBook = null;
        }
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
        const datePublished = document.getElementById('book-date-published').value;
        const publisher = document.getElementById('book-publisher').value.trim();
        const imageUrl = document.getElementById('book-image-url').value.trim();
        const isbn = document.getElementById('book-isbn').value.trim().replace(/[-\s]/g, ''); // Remove hyphens and spaces
        const selectedFormats = this.cleanFormatArray(this.getSelectedFormats());
        const rating = parseInt(document.getElementById('book-rating').value) || 0;
        const status = document.getElementById('book-status').value;

        // Series data
        const seriesDropdown = document.getElementById('book-series').value;
        const isSeries = seriesDropdown === 'Yes';
        const seriesName = document.getElementById('series-name').value.trim();
        const seriesNumber = parseFloat(document.getElementById('series-number').value) || null;

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
        if (!datePublished) {
            this.showNotification('Please enter a publication date', 'error');
            return;
        }
        if (!publisher) {
            this.showNotification('Please enter a publisher', 'error');
            return;
        }
        if (!imageUrl) {
            this.showNotification('Please enter an image URL', 'error');
            return;
        }
        if (!isbn) {
            this.showNotification('Please enter an ISBN', 'error');
            return;
        }
        if (selectedFormats.length === 0) {
            this.showNotification('Please select at least one format', 'error');
            return;
        }
        // Only require rating for finished books
        if (status === 'Finished' && rating === 0) {
            this.showNotification('Please provide a rating for finished books', 'error');
            return;
        }

        // Validate series fields if series is checked
        if (isSeries) {
            if (!seriesName) {
                this.showNotification('Please enter a series name', 'error');
                return;
            }
            if (!seriesNumber || seriesNumber <= 0) {
                this.showNotification('Please enter a valid series number (e.g., 1, 1.5, 2)', 'error');
                return;
            }
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
                    publisher: publisher,
                    isbn: isbn,
                    status: document.getElementById('book-status').value,
                    format: selectedFormats,
                    userRating: rating,
                    coverUrl: imageUrl,
                    // Update date fields
                    dateStarted: document.getElementById('book-date-started').value || null,
                    dateFinished: document.getElementById('book-date-finished').value || null,
                    // Update series fields
                    series: isSeries,
                    seriesName: isSeries ? seriesName : null,
                    seriesNumber: isSeries ? seriesNumber : null,
                    // Keep existing metadata
                    dateAdded: this.editingBook.dateAdded,
                    lastApiUpdate: this.editingBook.lastApiUpdate
                };

                // Update reading dates based on status changes (only auto-set if user didn't provide dates)
                const originalStatus = this.editingBook.status;
                const userProvidedStartDate = document.getElementById('book-date-started').value;
                const userProvidedFinishDate = document.getElementById('book-date-finished').value;

                if (bookData.status !== originalStatus) {
                    // Status changed during editing
                    if (bookData.status === 'Reading' && !userProvidedStartDate && !bookData.dateStarted) {
                        bookData.dateStarted = new Date().toISOString().split('T')[0];
                    } else if (bookData.status === 'Finished') {
                        if (!userProvidedStartDate && !bookData.dateStarted) {
                            bookData.dateStarted = new Date().toISOString().split('T')[0];
                        }
                        if (!userProvidedFinishDate && !bookData.dateFinished) {
                            bookData.dateFinished = new Date().toISOString().split('T')[0];
                        }
                    } else if (bookData.status === 'TBR' && originalStatus !== 'TBR') {
                        // Only reset dates if moving back to TBR from another status and user didn't provide dates
                        if (!userProvidedStartDate) bookData.dateStarted = null;
                        if (!userProvidedFinishDate) bookData.dateFinished = null;
                        bookData.currentPage = 0;
                    } else if (bookData.status === 'DNF') {
                        // For DNF, keep start date but clear finish date (unless user provided dates)
                        if (!userProvidedStartDate && !bookData.dateStarted) {
                            bookData.dateStarted = new Date().toISOString().split('T')[0];
                        }
                        if (!userProvidedFinishDate) {
                            bookData.dateFinished = null;
                        }
                    }
                }
            } else {
                // Adding new book
                bookData = {
                    isbn: isbn,
                    title: title,
                    author: author,
                    genre: genre,
                    synopsis: synopsis,
                    pageCount: pages,
                    datePublished: datePublished,
                    publisher: publisher,
                    status: document.getElementById('book-status').value,
                    format: selectedFormats,
                    userRating: rating,
                    dateAdded: new Date().toISOString().split('T')[0],
                    dateStarted: document.getElementById('book-date-started').value || null,
                    dateFinished: document.getElementById('book-date-finished').value || null,
                    currentPage: 0,
                    coverUrl: imageUrl,
                    series: isSeries,
                    seriesName: isSeries ? seriesName : null,
                    seriesNumber: isSeries ? seriesNumber : null
                };

                // Set reading dates based on status for new books (only if not provided by user)
                if (bookData.status === 'Reading' && !bookData.dateStarted) {
                    bookData.dateStarted = new Date().toISOString().split('T')[0];
                } else if (bookData.status === 'Finished') {
                    if (!bookData.dateStarted) {
                        bookData.dateStarted = new Date().toISOString().split('T')[0];
                    }
                    if (!bookData.dateFinished) {
                        bookData.dateFinished = new Date().toISOString().split('T')[0];
                    }
                }

                // No API fetching - using manual data entry only
            }

            // Store current page for editing (to preserve pagination)
            const currentPageBeforeUpdate = this.editingBook ? this.currentPage : 1;

            // Handle editing vs adding
            if (this.editingBook) {
                // Update existing book in database
                await this.updateBookInDatabase(bookData);

                // Update local array
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
            } else {
                // Adding new book - check for duplicates (exclude current book if editing)
                const existingBook = this.books.find(book =>
                    // Skip the book being edited if we're in edit mode
                    book !== this.editingBook &&
                    (book.isbn === bookData.isbn ||
                     (book.title.toLowerCase() === bookData.title.toLowerCase() &&
                      book.author.toLowerCase() === bookData.author.toLowerCase()))
                );

                if (existingBook) {
                    this.showNotification('This book already exists in your library!', 'error');
                    return;
                }

                // Add to database
                await this.addBookToDatabase(bookData);

                // Add to local array
                this.books.push(bookData);
                this.showNotification(`"${bookData.title}" has been added to your library!`, 'success');
            }

            // Clear editing state after processing
            const wasEditing = !!this.editingBook;
            this.editingBook = null;

            this.populateSeriesFilter(); // Repopulate series filter after adding/updating book
            this.populateGenreFilter(); // Repopulate genre filter after adding/updating book
            this.populatePublisherFilter(); // Repopulate publisher filter after adding/updating book
            this.populateYearReadFilter(); // Repopulate year read filter after adding/updating book
            this.populatePageCountFilter(); // Repopulate page count filter after adding/updating book
            this.populateDatePublishedFilter(); // Repopulate date published filter after adding/updating book

            // Preserve current page if we were editing (to stay on same page)
            if (wasEditing) {
                this.currentPage = currentPageBeforeUpdate;
                this.preserveCurrentPage = true; // Flag to prevent page reset in applyFilters
            }

            this.applyFilters();
            this.updateStats();
            this.closeModals();

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

    // Add book to Supabase database
    async addBookToDatabase(bookData) {
        if (!this.supabase) {
            console.log('No database connection, skipping database save');
            return;
        }

        try {
            const dbBook = this.convertToDbFormat(bookData);
            const { data, error } = await this.supabase
                .from('reading_nook')
                .insert([dbBook])
                .select();

            if (error) {
                throw error;
            }

            console.log('✅ Book added to database:', data);
        } catch (error) {
            console.error('❌ Error adding book to database:', error);
            this.showNotification('Book added locally but failed to save to database', 'warning');
        }
    }

    // Update book in Supabase database
    async updateBookInDatabase(bookData) {
        if (!this.supabase) {
            console.log('No database connection, skipping database update');
            return;
        }

        try {
            const dbBook = this.convertToDbFormat(bookData);
            const { data, error } = await this.supabase
                .from('reading_nook')
                .update(dbBook)
                .eq('isbn', bookData.isbn)
                .select();

            if (error) {
                throw error;
            }

            console.log('✅ Book updated in database:', data);
        } catch (error) {
            console.error('❌ Error updating book in database:', error);
            this.showNotification('Book updated locally but failed to save to database', 'warning');
        }
    }

    // Delete book from Supabase database
    async deleteBookFromDatabase(isbn) {
        if (!this.supabase) {
            console.log('No database connection, skipping database delete');
            return;
        }

        try {
            const { error } = await this.supabase
                .from('reading_nook')
                .delete()
                .eq('isbn', isbn);

            if (error) {
                throw error;
            }

            console.log('✅ Book deleted from database');
        } catch (error) {
            console.error('❌ Error deleting book from database:', error);
            this.showNotification('Book deleted locally but failed to remove from database', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Calculate position based on existing notifications (from bottom)
        const existingNotifications = document.querySelectorAll('.notification');
        let bottomPosition = 20; // Start at 20px from top

        existingNotifications.forEach(existing => {
            const rect = existing.getBoundingClientRect();
            bottomPosition += rect.height + 10; // Add height + 10px margin
        });

        notification.style.bottom = `${bottomPosition}px`;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                // Reposition remaining notifications
                this.repositionNotifications();
            }, 300);
        }, 3000);
    }

    repositionNotifications() {
        const notifications = document.querySelectorAll('.notification');
        let bottomPosition = 20;

        notifications.forEach(notification => {
            notification.style.bottom = `${bottomPosition}px`;
            notification.style.top = 'auto'; // Clear any existing top positioning
            const rect = notification.getBoundingClientRect();
            bottomPosition += rect.height + 10;
        });
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

    editBook(isbn, title, author) {
        console.log('🔧 editBook method called with ISBN:', isbn, 'Title:', title, 'Author:', author);
        console.log('🔧 Authentication status:', this.isAuthenticated);

        if (!this.isAuthenticated) {
            console.log('❌ Not authenticated, showing warning');
            this.showNotification('Please go to Settings to authenticate before editing books', 'warning');
            return;
        }

        console.log('🔧 Looking for book...');
        console.log('🔧 Available books:', this.books.map(b => ({ title: b.title, isbn: b.isbn, author: b.author })));

        // Try multiple methods to find the book
        let book = null;

        // Method 1: Find by ISBN (exact match)
        if (isbn) {
            book = this.books.find(b => b.isbn === isbn);
            if (book) console.log('✅ Found book by ISBN (exact match)');
        }

        // Method 2: Find by ISBN (loose match)
        if (!book && isbn) {
            book = this.books.find(b => b.isbn == isbn);
            if (book) console.log('✅ Found book by ISBN (loose match)');
        }

        // Method 3: Find by title and author
        if (!book && title && author) {
            book = this.books.find(b =>
                b.title && b.author &&
                b.title.toLowerCase().trim() === title.toLowerCase().trim() &&
                b.author.toLowerCase().trim() === author.toLowerCase().trim()
            );
            if (book) console.log('✅ Found book by title and author');
        }

        // Method 4: Find by title only (as last resort)
        if (!book && title) {
            book = this.books.find(b =>
                b.title && b.title.toLowerCase().trim() === title.toLowerCase().trim()
            );
            if (book) console.log('✅ Found book by title only');
        }

        console.log('🔧 Final found book:', book);

        if (book) {
            console.log('✅ Book found, proceeding with edit');
            // Store the original book for updating BEFORE opening the modal
            this.editingBook = book;

            // Close current modal first (but preserve editing state)
            this.closeModals(false);

            // Wait a moment for the modal to close, then open the edit form
            setTimeout(() => {
                // Handle format first - convert old "Both" format to array and clean it
                let bookFormats = book.format;
                console.log('Original book format:', bookFormats);

                if (bookFormats === 'Both') {
                    bookFormats = ['Physical', 'Kindle'];
                } else if (!Array.isArray(bookFormats)) {
                    bookFormats = [bookFormats || 'Physical'];
                }

                // Clean the format array to remove duplicates and limit to 3
                bookFormats = this.cleanFormatArray(bookFormats);
                console.log('Cleaned book formats:', bookFormats);

                // Pre-fill the add book form with existing data
                document.getElementById('book-title').value = book.title || '';
                document.getElementById('book-author').value = book.author || '';
                document.getElementById('book-genre').value = book.genre || '';
                document.getElementById('book-image-url').value = book.coverUrl || '';
                document.getElementById('book-isbn').value = book.isbn || '';
                document.getElementById('book-synopsis').value = book.synopsis || '';
                document.getElementById('book-pages').value = book.pageCount || '';
                document.getElementById('book-date-published').value = book.datePublished || '';
                document.getElementById('book-publisher').value = book.publisher || '';
                document.getElementById('book-status').value = book.status || 'TBR';

                // Set format checkboxes BEFORE other operations
                console.log('Setting format checkboxes:', bookFormats);
                document.querySelectorAll('input[name="format"]').forEach(cb => {
                    cb.checked = false;
                });
                bookFormats.forEach(format => {
                    const checkbox = document.querySelector(`input[name="format"][value="${format}"]`);
                    if (checkbox) {
                        console.log(`Checking format: ${format}`);
                        checkbox.checked = true;
                    } else {
                        console.warn(`Format checkbox not found: ${format}`);
                    }
                });

                // Update image preview
                this.updateImagePreview(book.coverUrl || '');

                // Update character count
                this.updateCharacterCount((book.synopsis || '').length);

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

                // Handle series fields
                const seriesDropdown = document.getElementById('book-series');
                const seriesNameField = document.getElementById('series-name');
                const seriesNumberField = document.getElementById('series-number');

                if (book.series) {
                    seriesDropdown.value = 'Yes';
                    seriesNameField.value = book.seriesName || '';
                    seriesNumberField.value = book.seriesNumber || '';
                    this.handleSeriesChange('Yes');
                } else {
                    seriesDropdown.value = 'No';
                    seriesNameField.value = '';
                    seriesNumberField.value = '';
                    this.handleSeriesChange('No');
                }

                // Image URL field remains enabled during editing

                // Change form title and button text
                const modal = document.getElementById('add-book-modal');
                const title = modal.querySelector('h2');
                const submitBtn = modal.querySelector('button[type="submit"]');

                title.textContent = 'Edit Book';
                submitBtn.textContent = 'Update Book';

                // Validate format selection
                this.validateFormatSelection();

                // Log final state
                console.log('Final checked formats:', this.getSelectedFormats());

                // Open the modal
                modal.classList.remove('hidden');
            }, 100);
        } else {
            console.error('❌ Book not found for ISBN:', isbn);
            this.showNotification('Book not found for editing', 'error');
        }
    }

    async deleteBook(isbn, title, author) {
        console.log('🔧 deleteBook method called with ISBN:', isbn, 'Title:', title, 'Author:', author);
        console.log('🔧 Authentication status:', this.isAuthenticated);

        if (!this.isAuthenticated) {
            console.log('❌ Not authenticated, showing warning');
            this.showNotification('Please go to Settings to authenticate before removing books', 'warning');
            return;
        }

        console.log('🔧 Looking for book...');
        console.log('🔧 Available books:', this.books.map(b => ({ title: b.title, isbn: b.isbn, author: b.author })));

        // Try multiple methods to find the book
        let book = null;

        // Method 1: Find by ISBN (exact match)
        if (isbn) {
            book = this.books.find(b => b.isbn === isbn);
            if (book) console.log('✅ Found book by ISBN (exact match)');
        }

        // Method 2: Find by ISBN (loose match)
        if (!book && isbn) {
            book = this.books.find(b => b.isbn == isbn);
            if (book) console.log('✅ Found book by ISBN (loose match)');
        }

        // Method 3: Find by title and author
        if (!book && title && author) {
            book = this.books.find(b =>
                b.title && b.author &&
                b.title.toLowerCase().trim() === title.toLowerCase().trim() &&
                b.author.toLowerCase().trim() === author.toLowerCase().trim()
            );
            if (book) console.log('✅ Found book by title and author');
        }

        // Method 4: Find by title only (as last resort)
        if (!book && title) {
            book = this.books.find(b =>
                b.title && b.title.toLowerCase().trim() === title.toLowerCase().trim()
            );
            if (book) console.log('✅ Found book by title only');
        }

        console.log('🔧 Final found book:', book);

        if (book) {
            console.log('✅ Book found, showing confirmation dialog');
            const confirmMessage = `Are you sure you want to remove "${book.title}" by ${book.author || 'Unknown Author'} from your library?\n\nThis action cannot be undone.`;

            if (confirm(confirmMessage)) {
                try {
                    // Delete from database first
                    await this.deleteBookFromDatabase(isbn);

                    // Remove from local array
                    this.books = this.books.filter(b => b.isbn !== isbn);
                    this.populateSeriesFilter(); // Repopulate series filter after deleting book
                    this.populateGenreFilter(); // Repopulate genre filter after deleting book
                    this.populatePublisherFilter(); // Repopulate publisher filter after deleting book
                    this.populateYearReadFilter(); // Repopulate year read filter after deleting book
                    this.populatePageCountFilter(); // Repopulate page count filter after deleting book
                    this.populateDatePublishedFilter(); // Repopulate date published filter after deleting book
                    this.applyFilters();
                    this.updateStats();
                    this.closeModals();
                    this.showNotification(`"${book.title}" has been removed from your library.`, 'success');
                } catch (error) {
                    console.error('Error deleting book:', error);
                    this.showNotification('Failed to delete book. Please try again.', 'error');
                }
            }
        } else {
            console.error('❌ Book not found for ISBN:', isbn);
            this.showNotification('Book not found for deletion', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookshelfLibrary();
});
