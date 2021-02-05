import { Http } from "code-push/script/acquisition-sdk";
import type { Callback } from "./callbackUtil";
/**
 * XMLHttpRequest-based implementation of Http.Requester.
 */
export declare class HttpRequester implements Http.Requester {
    private contentType;
    constructor(contentType?: string | undefined);
    request(verb: Http.Verb, url: string, callbackOrRequestBody: Callback<Http.Response> | string, callback?: Callback<Http.Response>): void;
    /**
     * Gets the HTTP method name as a string.
     * The reason for which this is needed is because the Http.Verb enum corresponds to integer values from native runtime.
     */
    private getHttpMethodName;
}
