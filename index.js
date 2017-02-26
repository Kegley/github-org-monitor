var http = require('http')
var createHandler = require('github-webhook-handler')
var simpleGit = require('simple-git')('../temp/')
var rimraf = require('rimraf');

var handler = createHandler({
    path: '/webhook',
    secret: 'deputy'
})

http.createServer(function(req, res) {
    handler(req, res, function(err) {
        res.statusCode = 404
        res.end('no such location')
    })
}).listen(8000)

handler.on('error', function(err) {
    console.error('Error:', err.message)
})

handler.on('push', function(event) {
    if (event.payload.ref.includes('master')) {
        console.log('Received a push event for %s to %s',
            event.payload.repository.name,
            event.payload.ref)
        console.log(event.payload.repository.url)
        simpleGit.clone(event.payload.repository.url,
            event.payload.repository.name)
        rimraf('../temp/' + event.payload.repository.name,
            function() {
                console.log("Removed: " + event.payload.repository.name)
            })
    }else {
        console.log(event.payload.repository.name + ': Commit to other branch made')
    }
})

handler.on('pull_request', function(event) {
    let pull_request = event.payload.pull_request
    console.log(pull_request.state)
    console.log(pull_request.merged)
    console.log(pull_request.mergeable)
    if((event.payload.action == 'opened' || event.payload.action == 'reopened')
        && !pull_request.merged && pull_request.mergeable !== false){
        console.log("Pull Request Mergeable - Merging")
        mergePullRequest(pull_request.url)
    }else {
        console.log("something else")
    }
    //console.log('Received an issue event for %s action=%s: #%d %s',
        //event.payload.repository.name,
        //event.payload.action,
        //event.payload.issue.number,
        //event.payload.issue.title)
})


//need to handle merging requests
function mergePullRequest(url) {
    console.log(url)
    var https = require('https')

    var options = {
      "host": url,
      "path": "/merge",
      "method": "PUT",
      "headers": {
        "Authorization" : "Bearer ",
        "Content-Type" : "application/json",
      }
    }

    callback = function(response) {
      var str = ''
      response.on('data', function(chunk){
        str += chunk
      })

      response.on('end', function(){
        console.log(str)
      })
    }

    var body = JSON.stringify({
      status: 'accepted'
    });
    let request = https.request(options, callback).end(body);
    request.on('error', function(err) {
        console.log()
    })
}
