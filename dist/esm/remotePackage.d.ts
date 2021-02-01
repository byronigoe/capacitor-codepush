import { SuccessCallback } from "./callbackUtil";
import { DownloadProgress, ILocalPackage, IRemotePackage, Package } from "./package";
/**
 * Defines a remote package, which represents an update package available for download.
 */
export declare class RemotePackage extends Package implements IRemotePackage {
    private isDownloading;
    /**
     * The URL at which the package is available for download.
     */
    downloadUrl: string;
    /**
     * Downloads the package update from the CodePush service.
     * TODO: implement download progress
     *
     * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
     */
    download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage>;
    /**
     * Aborts the current download session, previously started with download().
     */
    abortDownload(): Promise<void>;
}
