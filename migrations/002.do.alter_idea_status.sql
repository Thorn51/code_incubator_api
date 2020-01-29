CREATE TYPE project_status AS ENUM (
    'Idea',
    'In-Development'
    'Complete'
);

ALTER TABLE ideas
    ADD COLUMN  
        status project_status;

