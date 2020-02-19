# Code Incubator API

The Code Incubator API was developed as a capstone project in the Thinkful Engineering Flex program.

## Summary

This api is designed to serve the [Code Incubator client](https://github.com/Thorn51/code_incubator_client). The API provides services to perform all CRUD operations. A summary of the endpoints and example of data can be found below.

The API is deployed to Heroku.

## Authorization

All of the endpoints in the Code Incubator API are routed through authorization middleware. The first level of authorization requires a basic token. At this point, there is no mechanism in place to generate and share API tokens for use with the API.

The second level of authorization requires a user to be logged into the application. Without user authentication users are unable to visit protected endpoints.

# Enpoints

`[ Base URL: rocky-beyond-84426.herokuapp.com ]`

## Ideas

### Endpoint -> /api/ideas

#### `GET` /api/ideas

Authorization -> API Token

Response -> Application/json

Code - 200

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

#### `POST` /api/ideas

Authorization -> JWT -> requires user login

Request Body Requirements -> project_title & project_summary

    {
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API."
    }

Response -> Application/json

Status - 201 Created

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

### Endpoint -> /api/ideas/:id

#### `GET` /api/ideas/:id

#### `DELETE` /api/ideas/:id

#### `PATCH` /api/ideas/:id
