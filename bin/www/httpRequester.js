
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
class HttpRequester {
    constructor(contentType) {
        this.contentType = contentType;
    }
    request(verb, url, callbackOrRequestBody, callback) {
        var requestBody;
        var requestCallback = callback;
        if (!requestCallback && typeof callbackOrRequestBody === "function") {
            requestCallback = callbackOrRequestBody;
        }
        if (typeof callbackOrRequestBody === "string") {
            requestBody = callbackOrRequestBody;
        }
        var xhr = new XMLHttpRequest();
        var methodName = this.getHttpMethodName(verb);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var response = { statusCode: xhr.status, body: xhr.responseText };
                requestCallback && requestCallback(null, response);
            }
        };
        xhr.open(methodName, url, true);
        if (this.contentType) {
            xhr.setRequestHeader("Content-Type", this.contentType);
        }
        xhr.setRequestHeader("X-CodePush-Plugin-Name", "cordova-plugin-code-push");
        xhr.setRequestHeader("X-CodePush-Plugin-Version", cordova.require("cordova/plugin_list").metadata["cordova-plugin-code-push"]);
        xhr.setRequestHeader("X-CodePush-SDK-Version", cordova.require("cordova/plugin_list").metadata["code-push"]);
        xhr.send(requestBody);
    }
    getHttpMethodName(verb) {
        switch (verb) {
            case 0:
                return "GET";
            case 7:
                return "CONNECT";
            case 4:
                return "DELETE";
            case 1:
                return "HEAD";
            case 6:
                return "OPTIONS";
            case 8:
                return "PATCH";
            case 2:
                return "POST";
            case 3:
                return "PUT";
            case 5:
                return "TRACE";
            default:
                return null;
        }
    }
}
module.exports = HttpRequester;
