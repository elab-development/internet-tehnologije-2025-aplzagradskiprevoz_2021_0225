SET statement_timeout = 0;
SET client_encoding = 'UTF8';

\copy gtfs_routes(route_id,agency_id,route_short_name,route_long_name,route_type,route_url,route_color,route_text_color,route_sort_order,continuous_pickup,continuous_drop_off) FROM PROGRAM 'grep -v "^$" /gtfs/routes.txt' WITH (FORMAT csv, HEADER true, NULL '', DELIMITER ',');
\copy gtfs_trips(route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible) FROM PROGRAM 'grep -v "^$" /gtfs/trips.txt' WITH (FORMAT csv, HEADER true, NULL '', DELIMITER ',');
\copy gtfs_shapes(shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled) FROM PROGRAM 'grep -v "^$" /gtfs/shapes.txt' WITH (FORMAT csv, HEADER true, NULL '', DELIMITER ',');
\copy gtfs_stops(stop_id,stop_code,stop_name,stop_lat,stop_lon,zone_id,location_type,parent_station) FROM PROGRAM 'grep -v "^$" /gtfs/stops.txt' WITH (FORMAT csv, HEADER true, NULL '', DELIMITER ',');
\copy gtfs_stop_times(trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type,timepoint) FROM PROGRAM 'grep -v "^$" /gtfs/stop_times.txt' WITH (FORMAT csv, HEADER true, NULL '', DELIMITER ',');

TRUNCATE line_crowd_status, Trasa, line_shapes, Stanica, Linija RESTART IDENTITY;

INSERT INTO Linija (external_id, code, name, vrstaVozila)
SELECT route_id,
       COALESCE(NULLIF(route_short_name, ''), route_id) AS code,
       COALESCE(NULLIF(route_long_name, ''), route_short_name, route_id) AS name,
       CASE route_type
         WHEN 0 THEN 'tramvaj'
         WHEN 1 THEN 'metro'
         WHEN 2 THEN 'voz'
         WHEN 3 THEN 'autobus'
         WHEN 4 THEN 'trajekt'
         WHEN 5 THEN 'zicara'
         WHEN 6 THEN 'gondola'
         WHEN 7 THEN 'uspinjaca'
         ELSE 'vozilo'
       END AS vrstaVozila
FROM gtfs_routes;

INSERT INTO Stanica (external_id, code, nazivStanice, lokacijaStanice, lat, lon, geom)
SELECT stop_id,
       COALESCE(NULLIF(stop_code, ''), stop_id),
       stop_name,
       stop_lat::text || ',' || stop_lon::text,
       stop_lat,
       stop_lon,
       ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)
FROM gtfs_stops;

WITH route_shape AS (
  SELECT route_id, shape_id, COUNT(*) AS trips
  FROM gtfs_trips
  WHERE shape_id IS NOT NULL AND shape_id <> ''
  GROUP BY route_id, shape_id
), best_shape AS (
  SELECT DISTINCT ON (route_id) route_id, shape_id
  FROM route_shape
  ORDER BY route_id, trips DESC
)
INSERT INTO line_shapes (brLinije, geom)
SELECT l.brLinije,
       ST_SetSRID(
         ST_MakeLine(ARRAY_AGG(ST_MakePoint(gs.shape_pt_lon, gs.shape_pt_lat) ORDER BY gs.shape_pt_sequence)),
         4326
       )
FROM best_shape bs
JOIN Linija l ON l.external_id = bs.route_id
JOIN gtfs_shapes gs ON gs.shape_id = bs.shape_id
GROUP BY l.brLinije;

WITH route_shape AS (
  SELECT route_id, shape_id, COUNT(*) AS trips
  FROM gtfs_trips
  WHERE shape_id IS NOT NULL AND shape_id <> ''
  GROUP BY route_id, shape_id
), best_shape AS (
  SELECT DISTINCT ON (route_id) route_id, shape_id
  FROM route_shape
  ORDER BY route_id, trips DESC
), best_trip AS (
  SELECT DISTINCT ON (t.route_id) t.route_id, t.trip_id
  FROM gtfs_trips t
  JOIN best_shape bs ON bs.route_id = t.route_id AND bs.shape_id = t.shape_id
  ORDER BY t.route_id
)
INSERT INTO Trasa (brLinije, brStanice, redniBroj)
SELECT l.brLinije, s.brStanice, MIN(st.stop_sequence) AS redniBroj
FROM best_trip bt
JOIN gtfs_stop_times st ON st.trip_id = bt.trip_id
JOIN Stanica s ON s.external_id = st.stop_id
JOIN Linija l ON l.external_id = bt.route_id
GROUP BY l.brLinije, s.brStanice
ORDER BY l.brLinije, MIN(st.stop_sequence);

INSERT INTO line_crowd_status (brLinije, status, updated_at)
SELECT brLinije, 'none', NOW() FROM Linija;
