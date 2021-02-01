/**
 * XMLHttpRequest-based implementation of Http.Requester.
 */
export class HttpRequester {
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
        if (methodName === null)
            return;
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
        xhr.setRequestHeader("X-CodePush-Plugin-Name", "capacitor-plugin-code-push");
        xhr.setRequestHeader("X-CodePush-Plugin-Version", "1.11.13");
        xhr.setRequestHeader("X-CodePush-SDK-Version", "2.0.6");
        xhr.send(requestBody);
    }
    /**
     * Gets the HTTP method name as a string.
     * The reason for which this is needed is because the Http.Verb enum corresponds to integer values from native runtime.
     */
    getHttpMethodName(verb) {
        switch (verb) {
            case 0 /* GET */:
                return "GET";
            case 4 /* DELETE */:
                return "DELETE";
            case 1 /* HEAD */:
                return "HEAD";
            case 8 /* PATCH */:
                return "PATCH";
            case 2 /* POST */:
                return "POST";
            case 3 /* PUT */:
                return "PUT";
            case 5 /* TRACE */:
            case 6 /* OPTIONS */:
            case 7 /* CONNECT */:
            default:
                return null;
        }
    }
}
//# sourceMappingURL=httpRequester.js.map