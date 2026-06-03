// dataService.js
// Aggregates all "get" methods for books, chapters, shelfs, and shelf_books.
import { supabase } from './supabaseClient.js';

// Get all books
export async function getBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
  return { books: data, error };
}

// Get book by id
export async function getBook(book_id) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', book_id)
    .limit(1);
  return { book: data?.[0] ?? null, error };
}

// Get all chapters for a book
export async function getChapters(book_id) {
  const { data, error } = await supabase
    .from('book_texts')
    .select('id', 'title', 'order')
    .eq('book_id', book_id)
    .order('order', { ascending: true });
  return { chapters: data, error };
}

export async function getChapter(book_id, index) {
    const { data, error } = await supabase
        .from('book_texts')
        .select('*')
        .eq('book_id', book_id)
        .eq('"order"', index)
        .limit(1);
    return { chapter: data?.[0] ?? null, error };
}

// Get all shelfs
export async function getShelfs() {
  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .order('created_at', { ascending: false });
  return { shelfs: data, error };
}

// Get all books in a shelf
export async function getShelfBooks(shelf_id) {
  const { data, error } = await supabase
    .from('shelf_books')
    .select('book_id')
    .eq('shelf_id', shelf_id);
  return { bookIds: data ? data.map(x => x.book_id) : [], error };
}

// Get a signed URL for a book cover image
export async function getBookCoverUrl(bookId) {
    const { data, error } = await supabase.storage
        .from('book_covers')
        .getPublicUrl(`${bookId}.webp`);

    if (!error && data?.publicUrl) {
        return data.publicUrl;
    }

    console.log({error});
}