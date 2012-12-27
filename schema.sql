drop table if exists points;
create table points (
  id string primary key,
  author string,
  text string,
  lat string,
  lng string,
  time string,
  tags string
);

drop table if exists pointscells;
create table pointscells (
  id string REFERENCES points(id),
  cell_id string,
  PRIMARY KEY (id, cell_id)
);

drop table if exists pointstags;
create table pointstags (
  id string REFERENCES points(id),
  tag_id string,
  PRIMARY KEY (id, tag_id)
);


-- drop table if exists entries;
-- create table entries (
--   id integer primary key autoincrement,
--   title string not null,
--   text string not null
-- );
