#!/usr/bin/env node

/**
 * Virtual Bookshelf Library - Update Script
 * 
 * This script fetches book data from Google Books API and updates the library.
 * It can be run manually or scheduled to run daily via cron job.
 * 
 * Usage: node scripts/update-library.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class LibraryUpdater {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'data', 'books.json');
        this.coversPath = path.join(__dirname, '..', 'assets', 'covers');
        this.apiKey = process.env.GOOGLE_BOOKS_API_KEY || ''; // Optional API key for higher rate limits
        this.rateLimitDelay = 1000; // 1 second between API calls
    }

    async run() {
        console.log('🚀 Starting library update...');
        
        try {
            const books = await this.loadBooks();
            console.log(`📚 Found ${books.length} books to process`);
            
            const updatedBooks = await this.updateBooksData(books);
            await this.saveBooks(updatedBooks);
            
            console.log('✅ Library update completed successfully!');
            console.log(`📊 Updated ${updatedBooks.length} books`);
            
        } catch (error) {
            console.error('❌ Error updating library:', error.message);
            process.exit(1);
        }
    }

    async loadBooks() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.books || [];
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📝 No books.json found, creating new library');
                return [];
            }
            throw error;
        }
    }

    async saveBooks(books) {
        const data = {
            books: books,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${books.length} books to ${this.dataPath}`);
    }

    async updateBooksData(books) {
        const updatedBooks = [];
        
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            console.log(`🔄 Processing book ${i + 1}/${books.length}: ${book.title || book.isbn}`);
            
            try {
                const updatedBook = await this.fetchBookData(book);
                updatedBooks.push(updatedBook);
                
                // Rate limiting
                if (i < books.length - 1) {
                    await this.delay(this.rateLimitDelay);
                }
                
            } catch (error) {
                console.warn(`⚠️  Failed to update book ${book.isbn}: ${error.message}`);
                // Keep the original book data if API fails
                updatedBooks.push(book);
            }
        }
        
        return updatedBooks;
    }

    async fetchBookData(book) {
        // If book already has complete data and was updated recently, skip API call
        if (this.isBookDataComplete(book) && this.isRecentlyUpdated(book)) {
            console.log(`⏭️  Skipping ${book.title} (recently updated)`);
            return book;
        }

        let apiData = null;
        
        // Try to fetch by ISBN first
        if (book.isbn && (book.isbn.startsWith('978') || book.isbn.startsWith('979'))) {
            apiData = await this.fetchFromGoogleBooks(`isbn:${book.isbn}`);
        }
        
        // If ISBN search failed, try title + author
        if (!apiData && book.title && book.author) {
            const query = `intitle:"${book.title}" inauthor:"${book.author}"`;
            apiData = await this.fetchFromGoogleBooks(query);
        }
        
        // Merge API data with existing book data
        const updatedBook = { ...book };
        
        if (apiData) {
            const volumeInfo = apiData.volumeInfo;
            
            // Update fields only if they're missing or empty
            if (!updatedBook.title && volumeInfo.title) {
                updatedBook.title = volumeInfo.title;
            }
            
            if (!updatedBook.author && volumeInfo.authors) {
                updatedBook.author = volumeInfo.authors.join(', ');
            }
            
            if (!updatedBook.synopsis && volumeInfo.description) {
                updatedBook.synopsis = this.cleanDescription(volumeInfo.description);
            }
            
            if (!updatedBook.genre && volumeInfo.categories) {
                updatedBook.genre = volumeInfo.categories[0];
            }
            
            if (!updatedBook.pageCount && volumeInfo.pageCount) {
                updatedBook.pageCount = volumeInfo.pageCount;
            }
            
            if (!updatedBook.averageRating && volumeInfo.averageRating) {
                updatedBook.averageRating = volumeInfo.averageRating;
            }
            
            // Update cover image
            if (volumeInfo.imageLinks) {
                const coverUrl = volumeInfo.imageLinks.large || 
                               volumeInfo.imageLinks.medium || 
                               volumeInfo.imageLinks.small || 
                               volumeInfo.imageLinks.thumbnail;
                
                if (coverUrl) {
                    updatedBook.coverUrl = coverUrl.replace('http:', 'https:');
                    
                    // Optionally download and cache the cover image
                    try {
                        await this.downloadCover(updatedBook.isbn, updatedBook.coverUrl);
                    } catch (error) {
                        console.warn(`⚠️  Failed to download cover for ${book.title}`);
                    }
                }
            }
            
            updatedBook.lastApiUpdate = new Date().toISOString();
            console.log(`✅ Updated ${updatedBook.title}`);
        } else {
            console.log(`ℹ️  No API data found for ${book.title || book.isbn}`);
        }
        
        return updatedBook;
    }

    async fetchFromGoogleBooks(query) {
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}${this.apiKey ? `&key=${this.apiKey}` : ''}`;
        
        try {
            const response = await this.httpGet(apiUrl);
            const data = JSON.parse(response);
            
            if (data.items && data.items.length > 0) {
                return data.items[0]; // Return the first match
            }
            
            return null;
        } catch (error) {
            throw new Error(`Google Books API error: ${error.message}`);
        }
    }

    async downloadCover(isbn, coverUrl) {
        const filename = `${isbn}.jpg`;
        const filepath = path.join(this.coversPath, filename);
        
        // Check if cover already exists
        try {
            await fs.access(filepath);
            return; // Cover already exists
        } catch (error) {
            // Cover doesn't exist, download it
        }
        
        return new Promise((resolve, reject) => {
            const file = require('fs').createWriteStream(filepath);
            
            https.get(coverUrl, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`📸 Downloaded cover for ${isbn}`);
                        resolve();
                    });
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    httpGet(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}: ${data}`));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    cleanDescription(description) {
        // Remove HTML tags and clean up the description
        return description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    isBookDataComplete(book) {
        return book.title && book.author && book.synopsis && book.coverUrl && book.pageCount;
    }

    isRecentlyUpdated(book) {
        if (!book.lastApiUpdate) return false;
        
        const lastUpdate = new Date(book.lastApiUpdate);
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        
        return daysSinceUpdate < 7; // Consider recent if updated within 7 days
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the updater if this script is executed directly
if (require.main === module) {
    const updater = new LibraryUpdater();
    updater.run();
}

module.exports = LibraryUpdater;
