# 📚 My Reading Nook by Alicia Domingo

A beautiful, modern digital library application for managing your personal book collection. Features a clean interface with advanced filtering, dark mode support, comprehensive book management, and detailed reading statistics.

## ✨ Features

### 📚 Core Library Management
- **Modern Book Grid**: Clean card-based layout displaying book covers with status and format badges
- **Multi-Format Support**: Track books across Physical, Kindle, and Audiobook formats
- **Reading Status Tracking**: Organize books by TBR (To Be Read), Reading, Finished, and DNF (Did Not Finish)
- **Personal Ratings**: Rate books and track your reading preferences
- **Synopsis & Metadata**: Store detailed book information including page counts, publication dates, genres, and personal notes

### 🔍 Advanced Search & Organization
- **Multi-Field Search**: Search across title, author, format, and genre simultaneously
- **Comprehensive Filtering**: Filter by genre, page count ranges, format, status, word count, average rating, and reading time
- **Collapsible Filter Categories**: Organized sidebar with expandable filter sections
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

### 📝 Enhanced Book Management
- **Detailed Add/Edit Forms**: Two-column layout with image preview functionality
- **Genre Dropdown**: Pre-populated with 20 popular genres for consistency
- **Format Checkboxes**: Multi-select format options with visual feedback
- **Character Counting**: Real-time character count for synopsis field
- **Form Validation**: Comprehensive validation with user-friendly error messages
- **Image URL Preview**: Live preview of book covers when entering image URLs

### 🎨 Visual Design
- **Book Icon Branding**: Custom book icon in header and browser favicon
- **Format Badges**: Color-coded badges (Physical: Pink, Kindle: Purple, Audiobook: Yellow)
- **Status Indicators**: Clear visual status badges on each book card
- **Smooth Animations**: Transitions and hover effects throughout the interface
- **Professional Footer**: Copyright notice with proper attribution

## 🚀 Quick Start

### Simple Setup (Recommended)
1. **Download or Clone**: Get the repository files to your local machine
2. **Open in Browser**: Simply open `index.html` in any modern web browser
3. **Start Adding Books**: Click "Add Book" to begin building your library
4. **Toggle Dark Mode**: Use the Settings button to switch between light and dark themes

### File Structure
```
my-reading-nook/
├── index.html          # Main application file
├── styles.css          # Complete styling with dark mode support
├── script.js           # JavaScript functionality and book management
├── book_image.png      # Book icon for branding
└── data/
    └── books.json      # Your book collection data (auto-created)
```

## 📖 Usage Guide

### Adding Your First Book
1. **Click "Add Book"**: Located in the main content area next to the sort controls
2. **Fill in Details**:
   - Enter title, author, and genre (from dropdown)
   - Add image URL for book cover (with live preview)
   - Set page count and publication date
   - Select reading status and choose format(s): Physical, Kindle, and/or Audiobook
   - Write a synopsis (with character counter)
   - Add start/end dates and personal rating
3. **Save**: Click "Add Book" to add to your collection

### Managing Your Library
- **Search**: Use the header search bar to find books across title, author, format, and genre
- **Filter**: Use the left sidebar to filter by:
  - Genre (multiple selections)
  - Page count ranges
  - Format types
  - Reading status
  - Word count estimates
  - Average ratings
  - Estimated reading time
- **Sort**: Choose from various sorting options in the main area
- **View Details**: Click any book card to see full information and edit options

### Using Dark Mode
1. **Access Settings**: Click the "Settings" button in the top-right corner
2. **Toggle Theme**: Use the dark mode switch to change themes
3. **Automatic Saving**: Your preference is saved and restored on future visits

## � Book Data Format

Books are automatically stored in `data/books.json` with the following structure:

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
      "imageUrl": "https://example.com/book-cover.jpg",
      "synopsis": "A captivating novel about...",
      "dateAdded": "2025-01-15",
      "dateStarted": "2025-01-20",
      "dateFinished": "2025-02-10",
      "currentPage": 400,
      "estimatedWords": 100000,
      "estimatedReadingTime": "6.7 hours"
    }
  ]
}
```

### Key Features of Data Structure:
- **Multi-Format Support**: `format` is an array supporting multiple formats per book
- **Comprehensive Metadata**: Includes reading dates, progress tracking, and estimates
- **Unique IDs**: Each book has a unique identifier for reliable data management
- **Flexible Ratings**: User ratings from 1-5 stars
- **Rich Content**: Synopsis field with character limit and validation

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
- **Character Limits**: Synopsis field limited to 500 characters with live counter

## 🐛 Troubleshooting

### Common Issues

**Books not displaying**:
- Ensure `data/books.json` exists and contains valid JSON
- Check browser console for JavaScript errors
- Verify all required fields are present in book data

**Dark mode not working**:
- Clear browser cache and localStorage
- Ensure you're using a modern browser that supports CSS custom properties
- Check that the Settings modal opens properly

**Images not loading**:
- Verify image URLs are accessible and valid
- Check that images support CORS if loading from external sources
- Use the image preview in the add/edit form to test URLs

**Filter/Search issues**:
- Clear all active filters using the "Clear All Filters" button
- Refresh the page to reset the application state
- Check that book data includes the fields you're searching/filtering by

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

- **System Font Stack** for optimal cross-platform readability
- **CSS Grid and Flexbox** for responsive layout capabilities
- **CSS Custom Properties** for seamless dark mode implementation
- **LocalStorage API** for persistent user preferences
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
- ✅ Multi-format support (Physical, Kindle, Audiobook)
- ✅ Reading status tracking (TBR, Reading, Finished, DNF)
- ✅ Personal ratings and synopsis storage
- ✅ Reading progress tracking with visual indicators
- ✅ Genre management with dropdown selection

**🔍 Advanced Search & Filtering**
- ✅ Multi-field search (title, author, format, genre)
- ✅ Comprehensive filter sidebar with collapsible categories
- ✅ Range-based filtering (pages, words, reading time)
- ✅ Multiple selection filters with OR logic
- ✅ Clear all filters functionality
- ✅ Flexible sorting options

**📊 Statistics & Analytics**
- ✅ Comprehensive statistics modal
- ✅ Reading progress analytics
- ✅ Format and status breakdowns
- ✅ Estimated reading time calculations
- ✅ Word count estimations

**⚙️ Settings & Preferences**
- ✅ Dark mode toggle with localStorage persistence
- ✅ Settings modal with professional toggle switches
- ✅ Theme preferences saved between sessions
- ✅ Smooth color transitions for all elements

### 🚀 Ready to Use

**My Reading Nook** is a complete, production-ready application with:

- **Zero Dependencies**: Pure HTML, CSS, and JavaScript - no build process required
- **Instant Setup**: Simply open `index.html` in any modern browser
- **Data Persistence**: Automatic saving to localStorage with JSON export capability
- **Professional Design**: Modern interface with attention to detail
- **Accessibility**: WCAG-compliant contrast ratios and keyboard navigation
- **Mobile Optimized**: Fully responsive design for all devices

### 🎯 Getting Started

1. **Download**: Clone or download the repository
2. **Open**: Launch `index.html` in your preferred browser
3. **Explore**: Try the dark mode toggle and add your first book
4. **Customize**: Modify colors and styles in `styles.css` as desired
5. **Enjoy**: Start building your personal digital library!

**Perfect for**: Personal book tracking, reading goal management, library organization, and book discovery.

Happy reading! 📚✨
