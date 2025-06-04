import Link from "next/link"
import { StarRating } from "./StarRating"
import { Calendar, User } from "lucide-react"

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

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <div className="text-center p-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{book.title}</h3>
            <p className="text-sm text-gray-600">by {book.author}</p>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{book.genre}</span>
            <div className="flex items-center space-x-1">
              <StarRating rating={book.avgRating} readonly size="sm" />
              <span className="text-xs text-gray-500">({book.reviewCount})</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{book.description}</p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(book.pubDate).getFullYear()}
            </div>
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {book.reviewCount} reviews
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
