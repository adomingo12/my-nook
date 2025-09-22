#!/usr/bin/env python3

"""
Virtual Bookshelf Library - Python Update Script

This script fetches book data from Google Books API and updates the library.
It can be run manually or scheduled to run daily via cron job.

Usage: python scripts/update-library.py

Requirements: Python 3.6+ (no additional packages required)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
import re

class LibraryUpdater:
    def __init__(self):
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.project_dir = os.path.dirname(self.script_dir)
        self.data_path = os.path.join(self.project_dir, 'data', 'books.json')
        self.covers_path = os.path.join(self.project_dir, 'assets', 'covers')
        self.api_key = os.environ.get('GOOGLE_BOOKS_API_KEY', '')
        self.rate_limit_delay = 1.0  # 1 second between API calls
        
        # Ensure covers directory exists
        os.makedirs(self.covers_path, exist_ok=True)

    def run(self):
        print('🚀 Starting library update...')
        
        try:
            books = self.load_books()
            print(f'📚 Found {len(books)} books to process')
            
            updated_books = self.update_books_data(books)
            self.save_books(updated_books)
            
            print('✅ Library update completed successfully!')
            print(f'📊 Updated {len(updated_books)} books')
            
        except Exception as error:
            print(f'❌ Error updating library: {error}')
            sys.exit(1)

    def load_books(self):
        try:
            with open(self.data_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                return data.get('books', [])
        except FileNotFoundError:
            print('📝 No books.json found, creating new library')
            return []
        except json.JSONDecodeError as error:
            raise Exception(f'Invalid JSON in books.json: {error}')

    def save_books(self, books):
        data = {
            'books': books,
            'lastUpdated': datetime.now().isoformat()
        }
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
        
        with open(self.data_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        
        print(f'💾 Saved {len(books)} books to {self.data_path}')

    def update_books_data(self, books):
        updated_books = []
        
        for i, book in enumerate(books):
            print(f'🔄 Processing book {i + 1}/{len(books)}: {book.get("title", book.get("isbn", "Unknown"))}')
            
            try:
                updated_book = self.fetch_book_data(book)
                updated_books.append(updated_book)
                
                # Rate limiting
                if i < len(books) - 1:
                    time.sleep(self.rate_limit_delay)
                    
            except Exception as error:
                print(f'⚠️  Failed to update book {book.get("isbn", "unknown")}: {error}')
                # Keep the original book data if API fails
                updated_books.append(book)
        
        return updated_books

    def fetch_book_data(self, book):
        # If book already has complete data and was updated recently, skip API call
        if self.is_book_data_complete(book) and self.is_recently_updated(book):
            print(f'⏭️  Skipping {book.get("title", "Unknown")} (recently updated)')
            return book

        api_data = None
        
        # Try to fetch by ISBN first
        isbn = book.get('isbn', '')
        if isbn and (isbn.startswith('978') or isbn.startswith('979')):
            api_data = self.fetch_from_google_books(f'isbn:{isbn}')
        
        # If ISBN search failed, try title + author
        if not api_data and book.get('title') and book.get('author'):
            query = f'intitle:"{book["title"]}" inauthor:"{book["author"]}"'
            api_data = self.fetch_from_google_books(query)
        
        # Merge API data with existing book data
        updated_book = book.copy()
        
        if api_data:
            volume_info = api_data.get('volumeInfo', {})
            
            # Update fields only if they're missing or empty
            if not updated_book.get('title') and volume_info.get('title'):
                updated_book['title'] = volume_info['title']
            
            if not updated_book.get('author') and volume_info.get('authors'):
                updated_book['author'] = ', '.join(volume_info['authors'])
            
            if not updated_book.get('synopsis') and volume_info.get('description'):
                updated_book['synopsis'] = self.clean_description(volume_info['description'])
            
            if not updated_book.get('genre') and volume_info.get('categories'):
                updated_book['genre'] = volume_info['categories'][0]
            
            if not updated_book.get('pageCount') and volume_info.get('pageCount'):
                updated_book['pageCount'] = volume_info['pageCount']
            
            if not updated_book.get('averageRating') and volume_info.get('averageRating'):
                updated_book['averageRating'] = volume_info['averageRating']
            
            # Update cover image
            image_links = volume_info.get('imageLinks', {})
            if image_links:
                cover_url = (image_links.get('large') or 
                           image_links.get('medium') or 
                           image_links.get('small') or 
                           image_links.get('thumbnail'))
                
                if cover_url:
                    updated_book['coverUrl'] = cover_url.replace('http:', 'https:')
                    
                    # Optionally download and cache the cover image
                    try:
                        self.download_cover(updated_book['isbn'], updated_book['coverUrl'])
                    except Exception as error:
                        print(f'⚠️  Failed to download cover for {book.get("title", "Unknown")}')
            
            updated_book['lastApiUpdate'] = datetime.now().isoformat()
            print(f'✅ Updated {updated_book.get("title", "Unknown")}')
        else:
            print(f'ℹ️  No API data found for {book.get("title", book.get("isbn", "Unknown"))}')
        
        return updated_book

    def fetch_from_google_books(self, query):
        encoded_query = urllib.parse.quote(query)
        api_url = f'https://www.googleapis.com/books/v1/volumes?q={encoded_query}'
        
        if self.api_key:
            api_url += f'&key={self.api_key}'
        
        try:
            with urllib.request.urlopen(api_url, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                if data.get('items') and len(data['items']) > 0:
                    return data['items'][0]  # Return the first match
                
                return None
                
        except urllib.error.HTTPError as error:
            raise Exception(f'Google Books API HTTP error: {error.code}')
        except urllib.error.URLError as error:
            raise Exception(f'Google Books API URL error: {error.reason}')
        except json.JSONDecodeError as error:
            raise Exception(f'Google Books API JSON error: {error}')

    def download_cover(self, isbn, cover_url):
        filename = f'{isbn}.jpg'
        filepath = os.path.join(self.covers_path, filename)
        
        # Check if cover already exists
        if os.path.exists(filepath):
            return  # Cover already exists
        
        try:
            with urllib.request.urlopen(cover_url, timeout=10) as response:
                with open(filepath, 'wb') as file:
                    file.write(response.read())
            print(f'📸 Downloaded cover for {isbn}')
        except Exception as error:
            raise Exception(f'Failed to download cover: {error}')

    def clean_description(self, description):
        """Remove HTML tags and clean up the description"""
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]*>', '', description)
        
        # Replace HTML entities
        clean_text = clean_text.replace('&quot;', '"')
        clean_text = clean_text.replace('&amp;', '&')
        clean_text = clean_text.replace('&lt;', '<')
        clean_text = clean_text.replace('&gt;', '>')
        
        return clean_text.strip()

    def is_book_data_complete(self, book):
        required_fields = ['title', 'author', 'synopsis', 'coverUrl', 'pageCount']
        return all(book.get(field) for field in required_fields)

    def is_recently_updated(self, book):
        last_update = book.get('lastApiUpdate')
        if not last_update:
            return False
        
        try:
            last_update_date = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            days_since_update = (datetime.now() - last_update_date).days
            return days_since_update < 7  # Consider recent if updated within 7 days
        except (ValueError, TypeError):
            return False

def main():
    """Main entry point when script is run directly"""
    updater = LibraryUpdater()
    updater.run()

if __name__ == '__main__':
    main()
