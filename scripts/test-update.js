#!/usr/bin/env node

/**
 * Test script for the Virtual Bookshelf Library update functionality
 * 
 * This script demonstrates how to use the LibraryUpdater class
 * and tests the API integration with a few sample books.
 */

const LibraryUpdater = require('./update-library.js');
const fs = require('fs').promises;
const path = require('path');

async function testUpdate() {
    console.log('🧪 Testing Virtual Bookshelf Library Update Script\n');
    
    // Create a test books.json with some sample data
    const testBooks = {
        books: [
            {
                isbn: "9780544003415",
                status: "Finished",
                format: "Physical",
                userRating: 5,
                dateAdded: "2024-01-15",
                dateStarted: "2024-01-20",
                dateFinished: "2024-02-10"
            },
            {
                isbn: "9780553103540",
                status: "Reading",
                format: "Kindle",
                userRating: 4,
                dateAdded: "2024-02-01",
                dateStarted: "2024-02-15",
                dateFinished: null,
                currentPage: 150
            },
            {
                isbn: "9780441172719",
                status: "TBR",
                format: "Physical",
                userRating: 0,
                dateAdded: "2024-03-01",
                dateStarted: null,
                dateFinished: null
            }
        ]
    };
    
    const dataPath = path.join(__dirname, '..', 'data', 'books-test.json');
    
    try {
        // Save test data
        await fs.writeFile(dataPath, JSON.stringify(testBooks, null, 2));
        console.log('✅ Created test books file');
        
        // Create updater instance
        const updater = new LibraryUpdater();
        updater.dataPath = dataPath; // Use test file
        
        console.log('\n🔄 Running update process...\n');
        
        // Run the update
        await updater.run();
        
        // Read the updated data
        const updatedData = await fs.readFile(dataPath, 'utf8');
        const updated = JSON.parse(updatedData);
        
        console.log('\n📊 Update Results:');
        console.log('==================');
        
        updated.books.forEach((book, index) => {
            console.log(`\n${index + 1}. ${book.title || 'Unknown Title'}`);
            console.log(`   Author: ${book.author || 'Unknown'}`);
            console.log(`   Pages: ${book.pageCount || 'Unknown'}`);
            console.log(`   Genre: ${book.genre || 'Unknown'}`);
            console.log(`   Cover: ${book.coverUrl ? '✅ Available' : '❌ Missing'}`);
            console.log(`   Synopsis: ${book.synopsis ? '✅ Available' : '❌ Missing'}`);
        });
        
        console.log('\n✅ Test completed successfully!');
        console.log(`📝 Test results saved to: ${dataPath}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testUpdate();
}

module.exports = testUpdate;
