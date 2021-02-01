import { Plugins } from "@capacitor/core";
import { SuccessCallback } from "./callbackUtil";
import { CodePushUtil } from "./codePushUtil";
import { LocalPackage } from "./localPackage";
import { NativeAppInfo } from "./nativeAppInfo";
import { DownloadProgress, ILocalPackage, IRemotePackage, Package } from "./package";
import { Sdk } from "./sdk";
import { Directory, Filesystem } from '@capacitor/filesystem';

const { FileTransfer } = Plugins;

/**
 * Defines a remote package, which represents an update package available for download.
 */
export class RemotePackage extends Package implements IRemotePackage {

    private isDownloading: boolean = false;

    /**
     * The URL at which the package is available for download.
     */
    public downloadUrl: string;

    /**
     * Downloads the package update from the CodePush service.
     * TODO: implement download progress
     *
     * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
     */
    public async download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage> {
        CodePushUtil.logMessage("Downloading update");
        if (!this.downloadUrl) {
            CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
            return;
        }

        this.isDownloading = true;

        const dataDirectory = await Filesystem.getUri({directory: Directory.Data, path: ""});
        const file = dataDirectory.uri + "/" + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName;

        try {
            await FileTransfer.download({source: this.downloadUrl, target: file});
        } catch (e) {
            CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
            return;
        } finally {
            this.isDownloading = false;
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

    /**
     * Aborts the current download session, previously started with download().
     */
    public async abortDownload(): Promise<void> {
        // TODO: implement download abort
        return new Promise((resolve, reject) => {
            this.isDownloading = false;
            resolve();
        });
    }
}
