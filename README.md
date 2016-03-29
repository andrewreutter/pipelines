# pipelines

The pipelines package provides a way for developers to:

- Define microservices that convert between media formats.
- Compose graphing pipelines of those microservices.

## Hello world

To start a cluster of local pipeline servers:

1. Make sure you have node installed
2. cd to the project directory
3. _npm install_
4. _node server.js_

You should see messages in the console:

```shell
Serving function at crud://media
Serving function at crud://conversion_request
Serving function at http://localhost:3000/create-media
Serving function at http://localhost:3001/search-media
Serving function at http://localhost:3002/create-conversion-request
Serving function at http://localhost:3003/search-conversion-request
Serving function at http://localhost:3004/pipeline-display_ad
Serving function at http://localhost:3005/pipeline-liner_ad
```

To send a payload to the display_ad entry point:

1. Copy the full url for /pipeline-display_ad from the messages in the console.
2. _curl -H "Content-Type: application/json" -X POST -d '{"pdf":"abc"}' URL_ 

## Code walkthrough

Start by looking at _server.js_, which is the beginning of the breadcrumb trail.

