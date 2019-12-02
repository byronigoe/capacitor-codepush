
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const core_1 = require("@capacitor/core");
const LocalPackage = require("./localPackage");
const Package = require("./package");
const NativeAppInfo = require("./nativeAppInfo");
const CodePushUtil = require("./codePushUtil");
const Sdk = require("./sdk");
const { Filesystem, FileTransfer } = core_1.Plugins;
class RemotePackage extends Package {
    async download(downloadProgress) {
        CodePushUtil.logMessage("Downloading update");
        if (!this.downloadUrl) {
            CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
            return;
        }
        const dataDirectory = await Filesystem.getUri({ directory: core_1.FilesystemDirectory.Data, path: "" });
        const file = dataDirectory.uri + "/" + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName;
        try {
            await FileTransfer.download({ source: this.downloadUrl, target: file });
        }
        catch (e) {
            CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
            return;
        }
        const installFailed = await NativeAppInfo.isFailedUpdate(this.packageHash);
        const localPackage = new LocalPackage();
        localPackage.deploymentKey = this.deploymentKey;
        localPackage.description = this.description;
        localPackage.label = this.label;
        localPackage.appVersion = this.appVersion;
        localPackage.isMandatory = this.isMandatory;
        localPackage.packageHash = this.packageHash;
        localPackage.isFirstRun = false;
        localPackage.failedInstall = installFailed;
        localPackage.localPath = file;
        CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
        Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);
        return localPackage;
    }
    async abortDownload() {
        throw new Error("Not implemented");
    }
}
module.exports = RemotePackage;
