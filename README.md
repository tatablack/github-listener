# github-listener

Github webhook. Can be used to filter notifications from multiple repositories, and notify interested parties based on different criteria.

## Database
[x] DB storage for push payloads. Need to store Author, commit id, repo, whether a review was required or not.
[x] Init: create database
[ ] create table with indexes
[ ] create tables: payloads, installations, config
    installations: {
        username: atata,
        lastSeen: _timestamp_
        rules: [
            'FE': {
                repo: 'aurora-frontend'
            }
        ]
    }
    config
        repo list? Like, every repo who has this set as a webhook? And what for?
        

## Service
[ ] Websocket server for real time communication, instead of client-side polling (would also make storing information on the server less urgent)

## Receive Notification handler
[ ] Every time we enrich a commit, use Github's API to get the gravatar based on the username (https://github.scm.corp.ebay.com/api/v3/users/USERNAME)
[ ] We should use a Promise in the createNotification handler, not delegate the actual response creation to the parser
[x] Add Lastseen to every payload received
[ ] Store information about the repository which is sending us notifications (so we'll tell the clients)


## Send Notification handler
[x] Calculate email hash on the server
[x] Add Lastseen to a client installation when the client retrieves notifications
[x] Filter notifications based on Lastseen delta
