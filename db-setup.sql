-- AdstatMe Database Setup
DROP DATABASE IF EXISTS adstatme_dev;
DROP USER IF EXISTS adstatme;

CREATE DATABASE adstatme_dev;
CREATE USER adstatme WITH PASSWORD 'adstatme123';
ALTER DATABASE adstatme_dev OWNER TO adstatme;

\c adstatme_dev
GRANT ALL ON SCHEMA public TO adstatme;

