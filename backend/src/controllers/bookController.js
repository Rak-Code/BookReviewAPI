const Book = require('../models/Book');
const Review = require('../models/Review');

// @desc    Create a new book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res) => {
    try {
        const { title, author, genre, description, publicationDate, isbn } = req.body;

        // Check if book with same title and author already exists
        const existingBook = await Book.findOne({ 
            title: { $regex: new RegExp(`^${title}$`, 'i') },
            author: { $regex: new RegExp(`^${author}$`, 'i') }
        });

        if (existingBook) {
            return res.status(400).json({
                status: 'error',
                message: 'A book with this title and author already exists'
            });
        }

        const book = new Book({
            title,
            author,
            genre,
            description,
            publicationDate,
            isbn,
            createdBy: req.user._id
        });

        await book.save();

        // Populate creator info
        await book.populate('createdBy', 'username email');

        res.status(201).json({
            status: 'success',
            message: 'Book created successfully',
            data: {
                book
            }
        });

    } catch (error) {
        console.error('Create book error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating book'
        });
    }
};

// @desc    Get all books with pagination and filters
// @route   GET /api/books
// @access  Public
const getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        
        if (req.query.author) {
            filter.author = { $regex: req.query.author, $options: 'i' };
        }
        
        if (req.query.genre) {
            filter.genre = { $regex: req.query.genre, $options: 'i' };
        }

        // Get total count for pagination
        const totalBooks = await Book.countDocuments(filter);
        const totalPages = Math.ceil(totalBooks / limit);

        // Get books with pagination
        const books = await Book.find(filter)
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: 'success',
            data: {
                books,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalBooks,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all books error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching books'
        });
    }
};

// @desc    Get single book by ID with reviews
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        const bookId = req.params.id;
        const reviewPage = parseInt(req.query.reviewPage) || 1;
        const reviewLimit = parseInt(req.query.reviewLimit) || 5;
        const reviewSkip = (reviewPage - 1) * reviewLimit;

        // Get book details
        const book = await Book.findById(bookId)
            .populate('createdBy', 'username email');

        if (!book) {
            return res.status(404).json({
                status: 'error',
                message: 'Book not found'
            });
        }

        // Get reviews with pagination
        const totalReviews = await Review.countDocuments({ bookId });
        const reviews = await Review.find({ bookId })
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .skip(reviewSkip)
            .limit(reviewLimit);

        const reviewTotalPages = Math.ceil(totalReviews / reviewLimit);

        res.status(200).json({
            status: 'success',
            data: {
                book: {
                    ...book.toObject(),
                    averageRating: book.averageRating,
                    totalReviews: book.totalReviews
                },
                reviews,
                reviewsPagination: {
                    currentPage: reviewPage,
                    totalPages: reviewTotalPages,
                    totalReviews,
                    limit: reviewLimit,
                    hasNext: reviewPage < reviewTotalPages,
                    hasPrev: reviewPage > 1
                }
            }
        });

    } catch (error) {
        console.error('Get book by ID error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid book ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching book'
        });
    }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private (Only book creator)
const updateBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const { title, author, genre, description, publicationDate, isbn } = req.body;

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                status: 'error',
                message: 'Book not found'
            });
        }

        // Check if user is the creator of the book
        if (book.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only update books you created'
            });
        }

        // Update book fields
        book.title = title || book.title;
        book.author = author || book.author;
        book.genre = genre || book.genre;
        book.description = description || book.description;
        book.publicationDate = publicationDate || book.publicationDate;
        book.isbn = isbn !== undefined ? isbn : book.isbn;

        await book.save();
        await book.populate('createdBy', 'username email');

        res.status(200).json({
            status: 'success',
            message: 'Book updated successfully',
            data: {
                book
            }
        });

    } catch (error) {
        console.error('Update book error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: messages
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid book ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating book'
        });
    }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private (Only book creator)
const deleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                status: 'error',
                message: 'Book not found'
            });
        }

        // Check if user is the creator of the book
        if (book.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only delete books you created'
            });
        }

        // Delete all reviews for this book first
        await Review.deleteMany({ bookId });

        // Delete the book
        await Book.findByIdAndDelete(bookId);

        res.status(200).json({
            status: 'success',
            message: 'Book and associated reviews deleted successfully'
        });

    } catch (error) {
        console.error('Delete book error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid book ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting book'
        });
    }
};

// @desc    Search books by title or author
// @route   GET /api/search
// @access  Public
const searchBooks = async (req, res) => {
    try {
        const { q: searchTerm, type = 'both' } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!searchTerm) {
            return res.status(400).json({
                status: 'error',
                message: 'Search term is required'
            });
        }

        // Build search query
        let searchQuery = {};
        
        if (type === 'title') {
            searchQuery.title = { $regex: searchTerm, $options: 'i' };
        } else if (type === 'author') {
            searchQuery.author = { $regex: searchTerm, $options: 'i' };
        } else {
            searchQuery.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { author: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Get total count
        const totalResults = await Book.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalResults / limit);

        // Perform search with pagination
        const books = await Book.find(searchQuery)
            .populate('createdBy', 'username')
            .sort({ averageRating: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: 'success',
            data: {
                results: books,
                searchTerm,
                searchType: type,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalResults,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while searching books'
        });
    }
};

module.exports = {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook,
    searchBooks
};