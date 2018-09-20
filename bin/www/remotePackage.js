
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const LocalPackage = require("./localPackage");
const Package = require("./package");
const NativeAppInfo = require("./nativeAppInfo");
const CodePushUtil = require("./codePushUtil");
const Sdk = require("./sdk");
class RemotePackage extends Package {
    download(successCallback, errorCallback, downloadProgress) {
        try {
            CodePushUtil.logMessage("Downloading update");
            if (!this.downloadUrl) {
                CodePushUtil.invokeErrorCallback(new Error("The remote package does not contain a download URL."), errorCallback);
            }
            else {
                this.currentFileTransfer = new FileTransfer();
                var downloadSuccess = (fileEntry) => {
                    this.currentFileTransfer = null;
                    fileEntry.file((file) => {
                        NativeAppInfo.isFailedUpdate(this.packageHash, (installFailed) => {
                            var localPackage = new LocalPackage();
                            localPackage.deploymentKey = this.deploymentKey;
                            localPackage.description = this.description;
                            localPackage.label = this.label;
                            localPackage.appVersion = this.appVersion;
                            localPackage.isMandatory = this.isMandatory;
                            localPackage.packageHash = this.packageHash;
                            localPackage.isFirstRun = false;
                            localPackage.failedInstall = installFailed;
                            localPackage.localPath = fileEntry.toInternalURL();
                            CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
                            successCallback && successCallback(localPackage);
                            Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);
                        });
                    }, (fileError) => {
                        CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), errorCallback);
                    });
                };
                var downloadError = (error) => {
                    this.currentFileTransfer = null;
                    CodePushUtil.invokeErrorCallback(new Error(error.body), errorCallback);
                };
                this.currentFileTransfer.onprogress = (progressEvent) => {
                    if (downloadProgress) {
                        var dp = { receivedBytes: progressEvent.loaded, totalBytes: progressEvent.total };
                        downloadProgress(dp);
                    }
                };
                this.currentFileTransfer.download(this.downloadUrl, cordova.file.dataDirectory + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName, downloadSuccess, downloadError, true);
            }
        }
        catch (e) {
            CodePushUtil.invokeErrorCallback(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""), errorCallback);
        }
    }
    abortDownload(abortSuccess, abortError) {
        try {
            if (this.currentFileTransfer) {
                this.currentFileTransfer.abort();
                abortSuccess && abortSuccess();
            }
        }
        catch (e) {
            abortError && abortError(e);
        }
    }
}
module.exports = RemotePackage;
