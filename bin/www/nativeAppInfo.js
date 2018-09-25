
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const core_1 = require("@capacitor/core");
const NativeCodePush = core_1.Plugins.CodePush;
const DefaultServerUrl = "https://codepush.azurewebsites.net/";
class NativeAppInfo {
    static async getApplicationBuildTime() {
        try {
            const result = await NativeCodePush.getNativeBuildTime();
            return result.value;
        }
        catch (e) {
            throw new Error("Could not get application timestamp.");
        }
    }
    static async getApplicationVersion() {
        try {
            const result = await NativeCodePush.getAppVersion();
            return result.value;
        }
        catch (e) {
            throw new Error("Could not get application version.");
        }
    }
    static async getBinaryHash() {
        try {
            const result = await NativeCodePush.getBinaryHash();
            return result.value;
        }
        catch (e) {
            throw new Error("Could not get binary hash.");
        }
    }
    static async getServerURL() {
        try {
            const result = await NativeCodePush.getServerURL();
            return result.value;
        }
        catch (e) {
            return DefaultServerUrl;
        }
    }
    static async getDeploymentKey() {
        try {
            const result = await NativeCodePush.getDeploymentKey();
            return result.value;
        }
        catch (e) {
            throw new Error("Deployment key not found.");
        }
    }
    static async isFailedUpdate(packageHash) {
        try {
            const result = await NativeCodePush.isFailedUpdate({ packageHash });
            return result.value;
        }
        catch (e) {
            return false;
        }
    }
    static async isFirstRun(packageHash) {
        try {
            const result = await NativeCodePush.isFirstRun({ packageHash });
            return result.value;
        }
        catch (e) {
            return false;
        }
    }
    static async isPendingUpdate() {
        try {
            const result = await NativeCodePush.isPendingUpdate();
            return result.value;
        }
        catch (e) {
            return false;
        }
    }
}
module.exports = NativeAppInfo;
