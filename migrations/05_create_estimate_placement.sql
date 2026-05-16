CREATE OR REPLACE FUNCTION estimate_placement(start_rating NUMERIC, end_rating NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    gain NUMERIC;
    dex_avg NUMERIC;
    placements NUMERIC[] := ARRAY[1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
    p NUMERIC;
    avg_opp NUMERIC;
    delta NUMERIC;
    best_placement NUMERIC := 1;
    best_delta NUMERIC := 'Infinity'::NUMERIC;
BEGIN
    gain := end_rating - start_rating;
    
    IF start_rating < 8200 THEN
        dex_avg := start_rating;
    ELSE
        dex_avg := start_rating - 0.85 * (start_rating - 8500);
    END IF;
    
    FOREACH p IN ARRAY placements
    LOOP
        avg_opp := start_rating - 148.1181435 * (100 - ((p - 1) * (200.0 / 7.0) + gain));
        
        IF avg_opp > 10000 THEN
            CONTINUE;
        END IF;
        
        delta := ABS(dex_avg - avg_opp);
        
        IF delta < best_delta THEN
            best_delta := delta;
            best_placement := p;
        END IF;
    END LOOP;
    
    RETURN best_placement;
END;
$$;