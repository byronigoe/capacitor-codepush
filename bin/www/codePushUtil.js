
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
class CodePushUtil {
    static copyUnassignedMembers(fromParameter, toParameter) {
        for (let key in fromParameter) {
            if (toParameter[key] === undefined || toParameter[key] === null) {
                toParameter[key] = fromParameter[key];
            }
        }
    }
    static getNodeStyleCallbackFor(successCallback, errorCallback) {
        return (error, result) => {
            if (error) {
                errorCallback && errorCallback(error);
            }
            else {
                successCallback && successCallback(result);
            }
        };
    }
    static getErrorMessage(e) {
        return e && e.message || e && e.toString() || "";
    }
    static logMessage(msg) {
        console.log(CodePushUtil.TAG + " " + msg);
    }
    static logError(message, error) {
        const errorMessage = `${message || ""} ${CodePushUtil.getErrorMessage(error)}`;
        const stackTrace = error && error.stack ? `. StackTrace: ${error.stack}` : '';
        console.error(`${CodePushUtil.TAG} ${errorMessage}${stackTrace}`);
    }
}
CodePushUtil.TAG = "[CodePush]";
CodePushUtil.invokeErrorCallback = (error, errorCallback) => {
    CodePushUtil.logError(null, error);
    errorCallback && errorCallback(error);
};
module.exports = CodePushUtil;
