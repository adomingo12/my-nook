-- SQL Functions for Reading Nook Statistics
-- Run these in your Supabase SQL Editor to enable optimized statistics queries

-- Function to get overall library statistics
CREATE OR REPLACE FUNCTION get_overall_stats()
RETURNS TABLE (
    total_books BIGINT,
    finished_books BIGINT,
    currently_reading BIGINT,
    to_be_read BIGINT,
    dnf_books BIGINT,
    total_pages BIGINT,
    finished_pages BIGINT,
    reading_time INTEGER,
    books_this_year BIGINT,
    average_rating NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_books,
        COUNT(*) FILTER (WHERE status = 'Finished') as finished_books,
        COUNT(*) FILTER (WHERE status = 'Reading') as currently_reading,
        COUNT(*) FILTER (WHERE status = 'TBR') as to_be_read,
        COUNT(*) FILTER (WHERE status = 'DNF') as dnf_books,
        COALESCE(SUM(page_count), 0) as total_pages,
        COALESCE(SUM(page_count) FILTER (WHERE status = 'Finished'), 0) as finished_pages,
        COALESCE(ROUND(SUM(page_count) FILTER (WHERE status = 'Finished') / 60), 0)::INTEGER as reading_time,
        COUNT(*) FILTER (
            WHERE status = 'Finished' 
            AND date_finished IS NOT NULL 
            AND EXTRACT(YEAR FROM date_finished::date) = EXTRACT(YEAR FROM CURRENT_DATE)
        ) as books_this_year,
        COALESCE(
            ROUND(
                AVG(user_rating) FILTER (
                    WHERE status = 'Finished' 
                    AND user_rating IS NOT NULL 
                    AND user_rating > 0
                ), 1
            ), 0
        ) as average_rating
    FROM reading_nook;
END;
$$;

-- Function to get yearly reading statistics
CREATE OR REPLACE FUNCTION get_yearly_stats()
RETURNS TABLE (
    year INTEGER,
    total_books BIGINT,
    total_pages BIGINT,
    reading_time INTEGER,
    avg_rating NUMERIC,
    top_genre TEXT,
    monthly_avg NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH yearly_data AS (
        SELECT 
            EXTRACT(YEAR FROM date_finished::date)::INTEGER as year,
            COUNT(*) as total_books,
            COALESCE(SUM(page_count), 0) as total_pages,
            COALESCE(ROUND(SUM(page_count) / 60), 0)::INTEGER as reading_time,
            COALESCE(
                ROUND(
                    AVG(user_rating) FILTER (
                        WHERE user_rating IS NOT NULL AND user_rating > 0
                    ), 1
                ), 0
            ) as avg_rating,
            ROUND(COUNT(*) / 12.0, 1) as monthly_avg
        FROM reading_nook
        WHERE status = 'Finished' 
        AND date_finished IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM date_finished::date)
    ),
    top_genres AS (
        SELECT 
            EXTRACT(YEAR FROM date_finished::date)::INTEGER as year,
            genre,
            COUNT(*) as genre_count,
            ROW_NUMBER() OVER (
                PARTITION BY EXTRACT(YEAR FROM date_finished::date) 
                ORDER BY COUNT(*) DESC
            ) as rn
        FROM reading_nook
        WHERE status = 'Finished' 
        AND date_finished IS NOT NULL
        AND genre IS NOT NULL
        AND genre != ''
        GROUP BY EXTRACT(YEAR FROM date_finished::date), genre
    )
    SELECT 
        yd.year,
        yd.total_books,
        yd.total_pages,
        yd.reading_time,
        yd.avg_rating,
        COALESCE(tg.genre, 'N/A') as top_genre,
        yd.monthly_avg
    FROM yearly_data yd
    LEFT JOIN top_genres tg ON yd.year = tg.year AND tg.rn = 1
    ORDER BY yd.year DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_overall_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yearly_stats() TO authenticated;

-- Grant execute permissions to anon users (for public access)
GRANT EXECUTE ON FUNCTION get_overall_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_yearly_stats() TO anon;
