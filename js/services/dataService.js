// dataService.js
// Aggregates all "get" methods for books, chapters, shelfs, and shelf_books.
import { supabase, SUPABASE_URL, SUPABASE_KEY, getCachedSession } from './supabaseClient.js';

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

// Get book texts by their IDs (preserves order of input IDs)
export async function getBookTextsByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return { bookTexts: [], error: null };
    }
    const { data, error } = await supabase
        .from('book_texts')
        .select('*')
        .in('id', ids);
    if (error || !data) {
        return { bookTexts: [], error };
    }
    const byId = Object.fromEntries(data.map(t => [t.id, t]));
    return { bookTexts: ids.map(id => byId[id]).filter(Boolean), error: null };
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

// Get all reading plans in a shelf
export async function getShelfReadingPlans(shelf_id) {
  const { data, error } = await supabase
    .from('shelf_reading_plans')
    .select('reading_plan_id, reading_plans(id, title, metadata)')
    .eq('shelf_id', shelf_id);
  return {
    readingPlans: data ? data.map(x => x.reading_plans).filter(Boolean) : [],
    error
  };
}

// Get a reading plan by id
export async function getReadingPlan(planId) {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .eq('id', planId)
    .limit(1);
  return { plan: data?.[0] ?? null, error };
}

// Get all chapters for a reading plan
export async function getReadingPlanChapters(planId) {
  const { data, error } = await supabase
    .from('reading_plan_chapters')
    .select('*')
    .eq('reading_plan_id', planId)
    .order('order', { ascending: true });
  return { chapters: data ?? [], error };
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

// Get reading progress for a book
export async function getProgress(bookId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        return null;
    }

    const { data, error } = await supabase
        .from('book_progress')
        .select('book_text_id, scroll_y')
        .eq('user_id', session.user.id)
        .eq('book_id', bookId)
        .limit(1);

    if (error || !data?.[0]) {
        return null;
    }

    return {
        bookTextId: data[0].book_text_id,
        scrollY: data[0].scroll_y ?? 0
    };
}

// Save reading progress for a book
export async function saveProgress(bookId, bookTextId, scrollY = 0) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        return;
    }

    await supabase
        .from('book_progress')
        .upsert({
            user_id: session.user.id,
            book_id: bookId,
            book_text_id: bookTextId,
            scroll_y: scrollY
        }, { onConflict: 'user_id,book_id' });
}

// Save reading progress using keepalive fetch (safe to call during beforeunload)
export function saveProgressKeepAlive(bookId, bookTextId, scrollY = 0) {
    const session = getCachedSession();
    if (!session?.user) {
        return Promise.resolve();
    }

    return fetch(`${SUPABASE_URL}/rest/v1/book_progress?on_conflict=user_id,book_id`, {
        method: 'POST',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
            user_id: session.user.id,
            book_id: bookId,
            book_text_id: bookTextId,
            scroll_y: scrollY
        })
    });
}