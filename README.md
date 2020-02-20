# Code Incubator API

The Code Incubator API was developed as a capstone project in the Thinkful Engineering Flex program.

## Summary

This API was created to serve the [Code Incubator client](https://github.com/Thorn51/code_incubator_client). The API provides services to perform CRUD operations on a PostgreSQL database. A summary of the endpoints and example of data can be found below.

The API is deployed to Heroku.

## Authorization

All of the endpoints in the Code Incubator API are routed through authorization middleware. The first level of authorization requires a basic token. At this point, there is no mechanism in place to generate and share API tokens for use with the API.

The second level of authorization middleware creates a JSON Web Token (JWT) after a successful login. All endpoints below will indicate the type of authorization required to successfully fetch data.

# Endpoints

Scheme `HTTPS`

`[ Base URL: rocky-beyond-84426.herokuapp.com ]`

## Ideas

### `GET` /api/ideas

Authorization -> API Token

#### Success -> Status 200 Ok

Response -> Application/json

    [
        {
        "id": 12,
        "project_title": "Testing",
        "project_summary": "Testing on firefox",
        "date_submitted": "2020-02-19T00:10:26.260Z",
        "status": "Idea",
        "github": "",
        "votes": "1",
        "author": 2
        },
        {
        "id": 1,
        "project_title": "Legislative Agenda ",
        "project_summary": "A place where citizens can vote and comment on the activities of congress. Constituents can provide their feedback on legislation, so their voice is heard in Congress.\n\nFeatures \nList of all legislation that users can read summaries, full bill, arguments for or against. Then the user can vote and comment on the legislation.",
        "date_submitted": "2020-02-11T00:56:32.690Z",
        "status": "Idea",
        "github": "",
        "votes": "2",
        "author": 2
        }
    ]

#### Error -> Status 401

Request fails due to missing bearer token in header.

    { error: "Unauthorized request" }

### `POST` /api/ideas

Authorization -> JWT -> requires user login

Request Body Requirements -> project_title & project_summary

    {
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API."
    }

#### Success -> Status 201 Created

Response -> Application/json

    {
        "id": 13,
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API.",
        "date_submitted": "2020-02-19T20:03:58.787Z",
        "github": "",
        "votes": "0",
        "status": "Idea",
        "author": 2
    }

### `GET` /api/ideas/:id

Authorization -> JWT -> requires user login

Response -> Application/json

Parameter -> Idea ID

Request /api/ideas/13

Status - 202 Ok

    {
        "id": 13,
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API.",
        "date_submitted": "2020-02-19T20:03:58.787Z",
        "github": "",
        "votes": "0",
        "status": "Idea",
        "author": 2
    }

### `DELETE` /api/ideas/:id

Authorization -> JWT -> requires user login

Parameter -> Idea ID

Request /api/ideas/13

Status - 204 No Content

### `PATCH` /api/ideas/:id

Authorization -> JWT -> requires user login

Response -> Application/json

Parameter -> Idea ID

Request /api/ideas/13

Status - 202 Ok

# Scripts

`npm start` - Starts the server in local development mode.
`npm run dev` - Starts the server with [nodemon](https://www.npmjs.com/package/nodemon). Very helpful during development!
`npm test` - Runs Mocha test files.
`npm run migrate` - Uses postgrator to build out tables in the database.
`npm run migrate:test` - Uses postgrator to build tables in a test database. The test database is used during integration testing.
`npm run migrate:production` - Build database tables in Heroku.
`npm run deploy` - Deploys to Heroku.

# Technologies

- Node.js
- Express
- PostgreSQL
- Bcrypt
- JWT
- Winston Logger
- XSS
