# 📚 My Reading Nook by Alicia Domingo

A beautiful, modern digital library application for managing your personal book collection. Features a clean interface with advanced filtering, dark mode support, comprehensive book management, detailed reading statistics, cloud database integration, and automatic book information lookup via Google Books API.

## ✨ Features

### 📚 Core Library Management
- **Modern Book Grid**: Clean card-based layout displaying book covers with status and format badges
- **Multi-Format Support**: Track books across Physical, Kindle, and Audiobook formats with duplicate prevention
- **Reading Status Tracking**: Organize books by TBR (To Be Read), Reading, Finished, and DNF (Did Not Finish)
- **Personal Ratings**: Rate books with 5-star system (required for finished books, optional for others)
- **Series Management**: Track book series with names and decimal numbering (1, 1.5, 2, etc.)
- **Synopsis & Metadata**: Store detailed book information with 1000-character synopsis limit
- **Google Books Integration**: Auto-fill book information using ISBN-13 lookup
- **Cloud Database**: Supabase PostgreSQL integration with real-time sync and offline fallback

### 🔍 Advanced Search & Organization
- **Multi-Field Search**: Search across title, author, format, and genre simultaneously
- **Comprehensive Filtering**: Filter by genre, page count ranges, format, status, series, publisher, and reading time
- **Series Filtering**: Filter by series name with automatic series-based sorting
- **Collapsible Filter Categories**: Organized sidebar with expandable filter sections
- **Smart Sorting**: Series-aware sorting that prioritizes series name and number when filtering
- **Flexible Sorting**: Sort by various criteria with ascending/descending options
- **Clear Filters**: Easy reset functionality for all active filters

### 🌙 Modern UI/UX
- **Dark Mode Support**: Complete light/dark theme toggle with smooth transitions
- **Settings Panel**: Dedicated settings modal with theme preferences
- **Modern Typography**: Highly readable system fonts with elegant title styling
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Fixed Sidebar Layout**: Independent scrolling areas for optimal navigation

### 📊 Statistics & Analytics
- **Comprehensive Statistics Modal**: Detailed reading analytics and progress tracking
- **Reading Insights**: Total books, pages read, estimated reading time, and completion rates
- **Format Breakdown**: Statistics by physical books, e-books, and audiobooks
- **Status Overview**: Visual breakdown of your reading pipeline
- **Notification System**: Stacked notifications with auto-positioning and smooth animations

### 📝 Enhanced Book Management
- **Detailed Add/Edit Forms**: Two-column layout with image preview functionality
- **Google Books Auto-Fill**: Enter ISBN-13 to automatically populate book information
- **Manual Lookup Button**: Trigger book information lookup with dedicated button
- **Genre Dropdown**: Pre-populated with 20 popular genres for consistency
- **Format Management**: Multi-select format options with max 3 formats and duplicate prevention
- **Series Support**: Dropdown for series (Yes/No) with conditional name and number fields
- **Decimal Series Numbers**: Support for series numbers like 1.5, 2.5 for special editions
- **Character Counting**: Real-time character count for 1000-character synopsis field
- **Smart Validation**: Context-aware validation (rating required only for finished books)
- **Image URL Preview**: Live preview of book covers when entering image URLs

### 🎨 Visual Design
- **Book Icon Branding**: Custom book icon in header and browser favicon
- **Format Badges**: Color-coded badges (Physical: Pink, Kindle: Purple, Audiobook: Yellow)
- **Status Indicators**: Clear visual status badges on each book card
- **Smooth Animations**: Transitions and hover effects throughout the interface
- **Professional Footer**: Copyright notice with proper attribution

## 🚀 Quick Start

### Database Setup (Recommended)
1. **Create Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Create New Project**: Set up a new Supabase project
3. **Configure Database**: Run the provided SQL schema to create the `reading_nook` table
4. **Get Credentials**: Copy your project URL and anon key
5. **Update Config**: Add your credentials to `config.js`

### Local Setup (Fallback)
1. **Download or Clone**: Get the repository files to your local machine
2. **Create Config**: Copy your Supabase credentials to `config.js` (see `config.js` for format)
3. **Open in Browser**: Simply open `index.html` in any modern web browser
4. **Start Adding Books**: Click "Add Book" to begin building your library
5. **Toggle Dark Mode**: Use the Settings button to switch between light and dark themes

### File Structure
```
my-reading-nook/
├── index.html                              # Main application file
├── styles.css                              # Complete styling with dark mode support
├── script.js                               # JavaScript functionality and book management
├── config.js                               # Local development config (gitignored)
├── config.production.js                    # GitHub Pages config (public demo)
├── config.example.js                       # Configuration template
├── book_image.png                          # Book icon for branding
├── .gitignore                              # Excludes config.js from version control
├── *.sql                                   # Database schema and migration files
└── data/
    └── books.json                          # Local fallback data (auto-created)
```

## 📖 Usage Guide

### Adding Your First Book
1. **Click "Add Book"**: Located in the main content area next to the sort controls
2. **Auto-Fill Option**: Enter an ISBN-13 and tab out to automatically populate book information
3. **Manual Entry**: Fill in details manually:
   - Enter title, author, and genre (from dropdown)
   - Add image URL for book cover (with live preview)
   - Set page count and publication date
   - Select reading status and choose format(s): Physical, Kindle, and/or Audiobook (max 3)
   - Add series information if applicable (name and decimal number)
   - Write a synopsis (1000 character limit with counter)
   - Add start/end dates and personal rating (required for finished books)
4. **Save**: Click "Add Book" to save to your cloud database

### Managing Your Library
- **Search**: Use the header search bar to find books across title, author, format, and genre
- **Filter**: Use the left sidebar to filter by:
  - Genre (multiple selections)
  - Page count ranges
  - Format types
  - Reading status
  - Series names (with series-aware sorting)
  - Publisher
  - Estimated reading time
- **Sort**: Choose from various sorting options with series-aware sorting when filtering by series
- **View Details**: Click any book card to see full information and edit options
- **Real-time Sync**: Changes automatically sync to your cloud database

### Using Dark Mode
1. **Access Settings**: Click the "Settings" button in the top-right corner
2. **Toggle Theme**: Use the dark mode switch to change themes
3. **Automatic Saving**: Your preference is saved and restored on future visits

### Using Google Books API
1. **Enter ISBN-13**: Type or paste a 13-digit ISBN in the ISBN field
2. **Auto-Lookup**: Tab out of the field or click the 🔍 button to trigger lookup
3. **Review Information**: Google Books will auto-fill title, author, synopsis, cover image, etc.
4. **Edit as Needed**: All auto-filled information can be modified before saving
5. **Manual Entry**: You can still add books manually without using the API

### Configuration Setup

#### For Local Development (Private Use):
1. **Copy Template**: Copy `config.example.js` to `config.js`
2. **Add Secure Credentials**: Update `config.js` with your real Supabase credentials and secure passwords
3. **Private Storage**: `config.js` is automatically gitignored and never committed to version control

#### For GitHub Pages Deployment (Public Demo):
1. **Use Production Config**: `config.production.js` is already set up with demo credentials
2. **Public Visibility**: These credentials will be publicly visible on GitHub Pages
3. **Demo Purpose**: Use simple demo passwords like `demo`/`demo123`

#### How It Works:
- **Local Development**: App tries to load `config.js` first (private, secure)
- **GitHub Pages**: Falls back to `config.production.js` (public, demo)
- **Database Connection**: App automatically connects to Supabase if configured
- **Fallback Mode**: Uses local storage if database connection fails

**Security Note**: `config.js` contains your private credentials and is gitignored. `config.production.js` is public and should only contain demo credentials.

## 📊 Book Data Format

Books are stored in Supabase PostgreSQL database with local JSON fallback. The data structure includes:

```json
{
  "books": [
    {
      "id": "unique-book-id",
      "title": "The Seven Husbands of Evelyn Hugo",
      "author": "Taylor Jenkins Reid",
      "genre": "Fiction",
      "status": "Finished",
      "format": ["Physical", "Kindle"],
      "userRating": 5,
      "pageCount": 400,
      "datePublished": "2019-06-13",
      "publisher": "Atria Books",
      "isbn": "9781501161933",
      "coverUrl": "https://example.com/book-cover.jpg",
      "synopsis": "A captivating novel about... (up to 1000 characters)",
      "dateAdded": "2025-01-15",
      "dateStarted": "2025-01-20",
      "dateFinished": "2025-02-10",
      "currentPage": 400,
      "series": true,
      "seriesName": "Standalone",
      "seriesNumber": 1.0,
      "estimatedWords": 100000,
      "estimatedReadingTime": "6.7 hours"
    }
  ]
}
```

### Key Features of Data Structure:
- **Multi-Format Support**: `format` is an array supporting up to 3 formats per book with duplicate prevention
- **Series Management**: Boolean `series` flag with optional `seriesName` and decimal `seriesNumber`
- **Comprehensive Metadata**: Includes reading dates, progress tracking, publisher, and ISBN
- **Unique IDs**: Each book has a unique identifier for reliable data management
- **Smart Ratings**: User ratings from 1-5 stars (required for finished books, optional for others)
- **Rich Content**: Synopsis field with 1000-character limit and real-time validation
- **Google Books Integration**: Auto-populated fields from ISBN lookup
- **Cloud Sync**: Real-time synchronization with Supabase PostgreSQL database

## 🎨 Customization

### Theme Customization
The application uses CSS variables for easy theme customization in `styles.css`:

**Light Mode Colors:**
```css
:root {
    --bg-primary: #f8fafc;      /* Main background */
    --bg-secondary: #ffffff;     /* Card backgrounds */
    --text-primary: #1f2937;     /* Main text */
    --text-secondary: #4b5563;   /* Secondary text */
}
```

**Dark Mode Colors:**
```css
[data-theme="dark"] {
    --bg-primary: #0f172a;      /* Dark background */
    --bg-secondary: #1e293b;     /* Dark card backgrounds */
    --text-primary: #f1f5f9;     /* Light text */
    --text-secondary: #e2e8f0;   /* Secondary light text */
}
```

### Badge Colors
- **Format Badges**: Physical (Pink), Kindle (Purple), Audiobook (Yellow)
- **Status Badges**: TBR (Gray), Reading (Blue), Finished (Green), DNF (Red)
- **Accent Color**: Pink (#d946ef) for buttons and focus states

### Typography
- **Font Family**: Modern system font stack for optimal readability across all devices
- **Title Font**: Times New Roman for the main "My Reading Nook" title for elegance
- **Font Sizes**: Responsive sizing with proper hierarchy
- **Character Limits**: Synopsis field limited to 1000 characters with live counter and color-coded warnings

## 🐛 Troubleshooting

### Common Issues

**Books not displaying**:
- Check browser console for database connection errors
- Verify `config.js` exists and contains valid Supabase credentials
- Ensure Supabase project is active and accessible
- Check that the `reading_nook` table exists in your database
- Fallback: App will use local storage if database connection fails

**Dark mode not working**:
- Clear browser cache and localStorage
- Ensure you're using a modern browser that supports CSS custom properties
- Check that the Settings modal opens properly

**Images not loading**:
- Verify image URLs are accessible and valid
- Check that images support CORS if loading from external sources
- Use the image preview in the add/edit form to test URLs

**Google Books API not working**:
- Verify you have an internet connection
- Check browser console for API errors
- Try the manual lookup button (🔍) if auto-lookup fails
- ISBN must be 10+ characters for lookup to trigger
- Not all books may be available in Google Books database

**Filter/Search issues**:
- Clear all active filters using the "Clear All Filters" button
- Refresh the page to reset the application state
- Check that book data includes the fields you're searching/filtering by
- Series filtering automatically enables series-based sorting

**Mobile responsiveness**:
- Clear browser cache
- Ensure you're using a modern mobile browser
- Check that viewport meta tag is present in HTML

## 🤝 Contributing

This is a personal reading management application, but you're welcome to:
- Fork the project for your own book collection
- Suggest improvements or report issues
- Share your customizations and enhancements
- Adapt the code for other collection management needs

## 📄 License

MIT License - feel free to use this project for personal, educational, or commercial purposes.

## 🙏 Acknowledgments

- **Supabase** for providing excellent PostgreSQL database-as-a-service
- **Google Books API** for comprehensive book information lookup
- **System Font Stack** for optimal cross-platform readability
- **CSS Grid and Flexbox** for responsive layout capabilities
- **CSS Custom Properties** for seamless dark mode implementation
- **LocalStorage API** for persistent user preferences and offline fallback
- **Modern JavaScript** for clean, maintainable code architecture

---

## 🎉 Current Features & Status

### ✅ Fully Implemented Features

**🎨 Modern UI/UX Design**
- ✅ Clean, card-based book display with cover images
- ✅ Complete dark/light mode with smooth transitions
- ✅ Modern system font typography for optimal readability
- ✅ Responsive design for all device sizes
- ✅ Professional header with book icon branding
- ✅ Fixed sidebar layout with independent scrolling

**📚 Comprehensive Book Management**
- ✅ Add/Edit/Delete books with detailed forms
- ✅ Multi-format support (Physical, Kindle, Audiobook) with max 3 formats and duplicate prevention
- ✅ Reading status tracking (TBR, Reading, Finished, DNF)
- ✅ Personal ratings (required for finished books, optional for others)
- ✅ Series management with names and decimal numbering (1, 1.5, 2, etc.)
- ✅ Synopsis storage with 1000-character limit and real-time validation
- ✅ Google Books API integration for automatic book information lookup
- ✅ Cloud database storage with Supabase PostgreSQL
- ✅ Reading progress tracking with visual indicators
- ✅ Genre management with dropdown selection

**🔍 Advanced Search & Filtering**
- ✅ Multi-field search (title, author, format, genre)
- ✅ Comprehensive filter sidebar with collapsible categories
- ✅ Series filtering with automatic series-based sorting
- ✅ Range-based filtering (pages, reading time)
- ✅ Multiple selection filters with OR logic
- ✅ Clear all filters functionality
- ✅ Smart sorting with series-aware logic

**📊 Statistics & Analytics**
- ✅ Comprehensive statistics modal
- ✅ Reading progress analytics
- ✅ Format and status breakdowns
- ✅ Estimated reading time calculations
- ✅ Word count estimations
- ✅ Stacked notification system with auto-positioning

**⚙️ Settings & Preferences**
- ✅ Dark mode toggle with localStorage persistence
- ✅ Settings modal with professional toggle switches
- ✅ Theme preferences saved between sessions
- ✅ Smooth color transitions for all elements

### 🚀 Ready to Use

**My Reading Nook** is a complete, production-ready application with:

- **Cloud Database**: Supabase PostgreSQL integration with real-time sync
- **Google Books API**: Automatic book information lookup via ISBN
- **Offline Fallback**: Local storage backup when database is unavailable
- **Zero Build Process**: Pure HTML, CSS, and JavaScript - no compilation required
- **Instant Setup**: Configure database credentials and open `index.html`
- **Professional Design**: Modern interface with attention to detail
- **Accessibility**: WCAG-compliant contrast ratios and keyboard navigation
- **Mobile Optimized**: Fully responsive design for all devices
- **Secure Configuration**: Environment variables kept separate from source code

### 🎯 Getting Started

1. **Download**: Clone or download the repository
2. **Setup Database**: Create a Supabase project and configure the database schema
3. **Configure**: Add your Supabase credentials to `config.js`
4. **Open**: Launch `index.html` in your preferred browser
5. **Test**: Try adding a book with ISBN lookup and explore dark mode
6. **Customize**: Modify colors and styles in `styles.css` as desired
7. **Enjoy**: Start building your personal digital library!

**Perfect for**: Personal book tracking, reading goal management, library organization, book discovery, and series management.

Happy reading! 📚✨
