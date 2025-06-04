"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { BookCard } from "@/components/BookCard"
import { Pagination } from "@/components/Pagination"
import { SearchBar } from "@/components/SearchBar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"

interface Book {
  id: string
  title: string
  author: string
  genre: string
  description: string
  avgRating: number
  reviewCount: number
  pubDate: string
  isbn: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("title")
  const { user } = useAuth()

  const fetchBooks = async (page = 1, query = "", type = "title") => {
    try {
      setLoading(true)
      let url = `/books?page=${page}&limit=12`

      if (query) {
        url = `/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=12`
      }

      const response = await api.get(url)
      setBooks(response.data.books || response.data.results || [])
      setTotalPages(response.data.totalPages || 1)
      setCurrentPage(page)
    } catch (error) {
      toast.error("Failed to fetch books")
      console.error("Error fetching books:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleSearch = (query: string, type: string) => {
    setSearchQuery(query)
    setSearchType(type)
    fetchBooks(1, query, type)
  }

  const handlePageChange = (page: number) => {
    fetchBooks(page, searchQuery, searchType)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Books</h1>
            <p className="text-gray-600 mt-1">Explore our collection of {books.length > 0 ? "amazing" : ""} books</p>
          </div>
          {user && (
            <Link href="/books/create">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Be the first to add a book!"}
            </p>
            {user && !searchQuery && (
              <Link href="/books/create">
                <Button className="btn-primary">Add First Book</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
