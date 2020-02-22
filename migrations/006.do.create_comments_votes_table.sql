CREATE TABLE comments_votes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vote_by_user INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment INTEGER REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    up_vote NUMERIC DEFAULT 0,
    down_vote NUMERIC DEFAULT 0
);