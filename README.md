# github-listener

## WebHook
GitHub instances can communicate to the world when something happens to one of their repositories.
There's plenty of application-specific "hooks" to deal with such communication, but the most generic one is called just "[WebHooks](https://developer.github.com/webhooks/)".

GitHub listener, here, is a WebHook implementation able to receive, parse and store information about commits (it started in a Corporate environment, and currenty GitHub Corporate instalations provide _only_ information about commits).

Every time the Listener receives a JSON payload from GitHub, it enriches the information with a few additional fields and stores it in a local [RethinkDB](http://rethinkdb.com/) instance.

## API
It also offers a HTTP API, currently implemented by a Chrome extension called [github-notifier](https://github.scm.corp.ebay.com/atata/github-notifier-chrome/). Every client installation register with the Listener, which will store the client configuration, allowing said client to keep polling the Listener in order to retrieve commits filtered by a set of user-defined criteria (currently, only filtering by @mentions and specific commit authors is supported).
