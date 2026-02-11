DROP TABLE IF EXISTS gtfs_stop_times;
DROP TABLE IF EXISTS gtfs_stops;
DROP TABLE IF EXISTS gtfs_shapes;
DROP TABLE IF EXISTS gtfs_trips;
DROP TABLE IF EXISTS gtfs_routes;

CREATE TABLE gtfs_routes (
  route_id TEXT PRIMARY KEY,
  agency_id TEXT,
  route_short_name TEXT,
  route_long_name TEXT,
  route_type INT,
  route_url TEXT,
  route_color TEXT,
  route_text_color TEXT,
  route_sort_order INT,
  continuous_pickup INT,
  continuous_drop_off INT
);

CREATE TABLE gtfs_trips (
  route_id TEXT,
  service_id TEXT,
  trip_id TEXT PRIMARY KEY,
  trip_headsign TEXT,
  trip_short_name TEXT,
  direction_id INT,
  block_id TEXT,
  shape_id TEXT,
  wheelchair_accessible INT
);

CREATE TABLE gtfs_shapes (
  shape_id TEXT,
  shape_pt_lat DOUBLE PRECISION,
  shape_pt_lon DOUBLE PRECISION,
  shape_pt_sequence INT,
  shape_dist_traveled DOUBLE PRECISION
);

CREATE TABLE gtfs_stops (
  stop_id TEXT PRIMARY KEY,
  stop_code TEXT,
  stop_name TEXT,
  stop_lat DOUBLE PRECISION,
  stop_lon DOUBLE PRECISION,
  zone_id TEXT,
  location_type INT,
  parent_station TEXT
);

CREATE TABLE gtfs_stop_times (
  trip_id TEXT,
  arrival_time TEXT,
  departure_time TEXT,
  stop_id TEXT,
  stop_sequence INT,
  pickup_type INT,
  drop_off_type INT,
  timepoint INT
);

CREATE INDEX idx_gtfs_trips_route_id ON gtfs_trips(route_id);
CREATE INDEX idx_gtfs_trips_shape_id ON gtfs_trips(shape_id);
CREATE INDEX idx_gtfs_shapes_shape_id ON gtfs_shapes(shape_id);
CREATE INDEX idx_gtfs_stop_times_trip_id ON gtfs_stop_times(trip_id);
CREATE INDEX idx_gtfs_stop_times_stop_id ON gtfs_stop_times(stop_id);
