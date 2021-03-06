require("./globals.js");

require('babel/polyfill')

var sg = require("./syncGatewayClient.js");
var diff = require("rus-diff").diff;

module.exports = {
    getData: function (method, docId, field, root) {
        var http = require('http');

        var options = {
            host: resourcesAPI.endpoint,
            port: resourcesAPI.port,
            path: method
        };

        callback = function (response) {
            var str = '';
            
            response.setEncoding('utf-8');
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                var results = JSON.parse(str)[root];

                results.forEach(function (data) {
                    var documentId;
                    documentId = docId + "::" + data[field];

                    sg.getDocument(documentId, function (cache) {
                        var newRevision = null;
                        // if the document does not exist, create it
                        if (cache.error === 'not_found') {
                            newRevision = {
                                channels: syncAPI.channels
                            };
                            newRevision[docId] = data;
                        } else {
                            var resourcesDiff = diff(cache[docId], data);
                            // if the document exsits and is updated, get the revision info and update it
                            if (resourcesDiff) {
                                console.log(resourcesDiff);
                                newRevision = cache;
                                newRevision[docId] = data;
                            }
                        }

                        if (newRevision !== null) {
                            sg.updateDocument(documentId, newRevision);
                        }
                    });
                });

            });
        }

        http.request(options, callback).end();
    }
};