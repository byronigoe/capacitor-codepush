import { Http } from "code-push/script/acquisition-sdk";
import { Callback } from "./callbackUtil";
import { Plugins } from "@capacitor/core";

const { Http: NativeHttp } = Plugins;

/**
 * XMLHttpRequest-based implementation of Http.Requester.
 */
export class HttpRequester implements Http.Requester {
    // TODO: use @capacitor-community/http

    private contentType: string | undefined;

    constructor(contentType?: string | undefined) {
        this.contentType = contentType;
    }

    public request(verb: Http.Verb, url: string, callbackOrRequestBody: Callback<Http.Response> | string, callback?: Callback<Http.Response>): void {
        var requestBody: string;
        var requestCallback: Callback<Http.Response> = callback!;

        // request(verb, url, callback)
        if (!requestCallback && typeof callbackOrRequestBody === "function") {
            requestCallback = <Callback<Http.Response>>callbackOrRequestBody;
        }

        // request(verb, url, requestBody, callback)
        if (typeof callbackOrRequestBody === "string") {
            requestBody = <string>callbackOrRequestBody;
        }

        var methodName = this.getHttpMethodName(verb);
        if (methodName === null) return requestCallback(new Error("Method Not Allowed"), null);
        const headers = {
            "X-CodePush-Plugin-Name": "cordova-plugin-code-push",
            "X-CodePush-Plugin-Version": "1.11.13",
            "X-CodePush-SDK-Version": "3.1.5"
        };
        if (this.contentType) {
            headers["Content-Type"] = this.contentType;
        }
        NativeHttp.request({
            method: methodName,
            data: requestBody,
            url,
            headers
        }).then((nativeRes) => {
            if (typeof nativeRes.data === "object") nativeRes.data = JSON.stringify(nativeRes.data);
            var response: Http.Response = { statusCode: nativeRes.status, body: nativeRes.data };
            requestCallback && requestCallback(null, response);
        });
    }

    /**
     * Gets the HTTP method name as a string.
     * The reason for which this is needed is because the Http.Verb enum corresponds to integer values from native runtime.
     */
    private getHttpMethodName(verb: Http.Verb): string | null {
        switch (verb) {
            case Http.Verb.GET:
                return "GET";
            case Http.Verb.DELETE:
                return "DELETE";
            case Http.Verb.HEAD:
                return "HEAD";
            case Http.Verb.PATCH:
                return "PATCH";
            case Http.Verb.POST:
                return "POST";
            case Http.Verb.PUT:
                return "PUT";
            case Http.Verb.TRACE:
            case Http.Verb.OPTIONS:
            case Http.Verb.CONNECT:
            default:
                return null;
        }
    }
}
