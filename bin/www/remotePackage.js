
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
    download(downloadProgress) {
        try {
            CodePushUtil.logMessage("Downloading update");
            if (!this.downloadUrl) {
                CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
            }
            else {
                this.currentFileTransfer = new FileTransfer();
                return new Promise((resolve, reject) => {
                    var downloadSuccess = (fileEntry) => {
                        this.currentFileTransfer = null;
                        fileEntry.file(async (file) => {
                            const installFailed = await NativeAppInfo.isFailedUpdate(this.packageHash);
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
                            resolve(localPackage);
                            Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);
                        }, (fileError) => {
                            CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), reject);
                        });
                    };
                    var downloadError = (error) => {
                        this.currentFileTransfer = null;
                        CodePushUtil.invokeErrorCallback(new Error(error.body), reject);
                    };
                    this.currentFileTransfer.onprogress = (progressEvent) => {
                        if (downloadProgress) {
                            var dp = { receivedBytes: progressEvent.loaded, totalBytes: progressEvent.total };
                            downloadProgress(dp);
                        }
                    };
                    this.currentFileTransfer.download(this.downloadUrl, cordova.file.dataDirectory + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName, downloadSuccess, downloadError, true);
                });
            }
        }
        catch (e) {
            CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
        }
    }
    async abortDownload() {
        if (this.currentFileTransfer) {
            this.currentFileTransfer.abort();
        }
    }
}
module.exports = RemotePackage;
