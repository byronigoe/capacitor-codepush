var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Directory, Filesystem } from "@capacitor/filesystem";
import { AcquisitionStatus } from "code-push/script/acquisition-sdk";
import { CodePushUtil } from "./codePushUtil";
import { FileUtil } from "./fileUtil";
import { InstallMode } from "./installMode";
import { NativeAppInfo } from "./nativeAppInfo";
import { CodePush as NativeCodePush } from "./nativeCodePushPlugin";
import { Package } from "./package";
import { Sdk } from "./sdk";
/**
 * Defines a local package.
 *
 * !! THIS TYPE IS READ FROM NATIVE CODE AS WELL. ANY CHANGES TO THIS INTERFACE NEEDS TO BE UPDATED IN NATIVE CODE !!
 */
export class LocalPackage extends Package {
    /**
     * Applies this package to the application. The application will be reloaded with this package and on every application launch this package will be loaded.
     * On the first run after the update, the application will wait for a codePush.notifyApplicationReady() call. Once this call is made, the install operation is considered a success.
     * Otherwise, the install operation will be marked as failed, and the application is reverted to its previous version on the next run.
     *
     * @param installOptions Optional parameter used for customizing the installation behavior.
     */
    install(installOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    CodePushUtil.logMessage("Installing update");
                    if (!installOptions) {
                        installOptions = LocalPackage.getDefaultInstallOptions();
                    }
                    else {
                        CodePushUtil.copyUnassignedMembers(LocalPackage.getDefaultInstallOptions(), installOptions);
                    }
                    var installError = (error) => {
                        CodePushUtil.invokeErrorCallback(error, reject);
                        Sdk.reportStatusDeploy(this, AcquisitionStatus.DeploymentFailed, this.deploymentKey);
                    };
                    let unzipDir;
                    try {
                        unzipDir = yield FileUtil.cleanDataDirectory(LocalPackage.DownloadUnzipDir);
                    }
                    catch (error) {
                        installError(error);
                        return;
                    }
                    try {
                        yield NativeCodePush.unzip({ zipFile: this.localPath, targetDirectory: unzipDir });
                    }
                    catch (unzipError) {
                        installError(new Error("Could not unzip package" + CodePushUtil.getErrorMessage(unzipError)));
                        return;
                    }
                    try {
                        const newPackageLocation = LocalPackage.VersionsDir + "/" + this.packageHash;
                        const deploymentResult = yield LocalPackage.handleDeployment(newPackageLocation);
                        yield this.verifyPackage(deploymentResult);
                        this.localPath = deploymentResult.deployDir;
                        this.finishInstall(deploymentResult.deployDir, installOptions, resolve, installError);
                    }
                    catch (error) {
                        installError(error);
                    }
                }
                catch (e) {
                    installError && installError(new Error("An error occured while installing the package. " + CodePushUtil.getErrorMessage(e)));
                }
            }));
        });
    }
    verifyPackage(deploymentResult) {
        return new Promise((resolve, reject) => {
            var deployDir = deploymentResult.deployDir;
            var verificationFail = (error) => {
                reject(error);
            };
            var verify = (isSignatureVerificationEnabled, isSignatureAppearedInBundle, publicKey, signature) => {
                if (isSignatureVerificationEnabled) {
                    if (isSignatureAppearedInBundle) {
                        this.verifyHash(deployDir, this.packageHash, verificationFail, () => {
                            this.verifySignature(deployDir, this.packageHash, publicKey, signature, verificationFail, resolve);
                        });
                    }
                    else {
                        var errorMessage = "Error! Public key was provided but there is no JWT signature within app bundle to verify. " +
                            "Possible reasons, why that might happen: \n" +
                            "1. You've been released CodePush bundle update using version of CodePush CLI that is not support code signing.\n" +
                            "2. You've been released CodePush bundle update without providing --privateKeyPath option.";
                        reject(new Error(errorMessage));
                    }
                }
                else {
                    if (isSignatureAppearedInBundle) {
                        CodePushUtil.logMessage("Warning! JWT signature exists in codepush update but code integrity check couldn't be performed because there is no public key configured. " +
                            "Please ensure that public key is properly configured within your application.");
                        // verifyHash
                        this.verifyHash(deployDir, this.packageHash, verificationFail, resolve);
                    }
                    else {
                        if (deploymentResult.isDiffUpdate) {
                            // verifyHash
                            this.verifyHash(deployDir, this.packageHash, verificationFail, resolve);
                        }
                        else {
                            resolve();
                        }
                    }
                }
            };
            if (deploymentResult.isDiffUpdate) {
                CodePushUtil.logMessage("Applying diff update");
            }
            else {
                CodePushUtil.logMessage("Applying full update");
            }
            var isSignatureVerificationEnabled, isSignatureAppearedInBundle;
            var publicKey;
            this.getPublicKey((error, publicKeyResult) => {
                if (error) {
                    reject(new Error("Error reading public key. " + error));
                    return;
                }
                publicKey = publicKeyResult;
                isSignatureVerificationEnabled = !!publicKey;
                this.getSignatureFromUpdate(deploymentResult.deployDir, (error, signature) => {
                    if (error) {
                        reject(new Error("Error reading signature from update. " + error));
                        return;
                    }
                    isSignatureAppearedInBundle = !!signature;
                    verify(isSignatureVerificationEnabled, isSignatureAppearedInBundle, publicKey, signature);
                });
            });
        });
    }
    getPublicKey(callback) {
        var success = (publicKey) => {
            callback(null, publicKey);
        };
        var fail = (error) => {
            callback(error, null);
        };
        NativeCodePush.getPublicKey().then(result => success(result.value || null), fail);
    }
    getSignatureFromUpdate(deployDir, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = deployDir + "/public/.codepushrelease";
            if (!(yield FileUtil.fileExists(Directory.Data, filePath))) {
                // signature absents in the bundle
                callback(null, null);
                return;
            }
            try {
                const signature = yield FileUtil.readFile(Directory.Data, filePath);
                callback(null, signature);
            }
            catch (error) {
                // error reading signature file from bundle
                callback(error, null);
            }
        });
    }
    verifyHash(deployDir, newUpdateHash, errorCallback, successCallback) {
        var packageHashSuccess = (computedHash) => {
            if (computedHash !== newUpdateHash) {
                errorCallback(new Error("The update contents failed the data integrity check."));
                return;
            }
            CodePushUtil.logMessage("The update contents succeeded the data integrity check.");
            successCallback();
        };
        var packageHashFail = (error) => {
            errorCallback(new Error("Unable to compute hash for package: " + error));
        };
        CodePushUtil.logMessage("Verifying hash for folder path: " + deployDir);
        NativeCodePush.getPackageHash({ path: deployDir }).then(result => packageHashSuccess(result.value), packageHashFail);
    }
    verifySignature(deployDir, newUpdateHash, publicKey, signature, errorCallback, successCallback) {
        var decodeSignatureSuccess = (contentHash) => {
            if (contentHash !== newUpdateHash) {
                errorCallback(new Error("The update contents failed the code signing check."));
                return;
            }
            CodePushUtil.logMessage("The update contents succeeded the code signing check.");
            successCallback();
        };
        var decodeSignatureFail = (error) => {
            errorCallback(new Error("Unable to verify signature for package: " + error));
        };
        CodePushUtil.logMessage("Verifying signature for folder path: " + deployDir);
        NativeCodePush.decodeSignature({ publicKey, signature }).then(result => decodeSignatureSuccess(result.value), decodeSignatureFail);
    }
    finishInstall(deployDir, installOptions, installSuccess, installError) {
        function backupPackageInformationFileIfNeeded(backupIfNeededDone) {
            return __awaiter(this, void 0, void 0, function* () {
                const pendingUpdate = yield NativeAppInfo.isPendingUpdate();
                if (pendingUpdate) {
                    // Don't back up the  currently installed update since it hasn't been "confirmed"
                    backupIfNeededDone(null, null);
                }
                else {
                    try {
                        yield LocalPackage.backupPackageInformationFile();
                        backupIfNeededDone(null, null);
                    }
                    catch (err) {
                        backupIfNeededDone(err, null);
                    }
                }
            });
        }
        LocalPackage.getCurrentOrDefaultPackage().then((oldPackage) => {
            backupPackageInformationFileIfNeeded((backupError) => {
                /* continue on error, current package information is missing if this is the first update */
                this.writeNewPackageMetadata().then(() => {
                    var invokeSuccessAndInstall = () => {
                        CodePushUtil.logMessage("Install succeeded.");
                        var installModeToUse = this.isMandatory ? installOptions.mandatoryInstallMode : installOptions.installMode;
                        if (installModeToUse === InstallMode.IMMEDIATE) {
                            /* invoke success before navigating */
                            installSuccess && installSuccess(installModeToUse);
                            /* no need for callbacks, the javascript context will reload */
                            NativeCodePush.install({
                                startLocation: deployDir,
                                installMode: installModeToUse,
                                minimumBackgroundDuration: installOptions.minimumBackgroundDuration
                            });
                        }
                        else {
                            NativeCodePush.install({
                                startLocation: deployDir,
                                installMode: installModeToUse,
                                minimumBackgroundDuration: installOptions.minimumBackgroundDuration
                            }).then(() => { installSuccess && installSuccess(installModeToUse); }, () => { installError && installError(); });
                        }
                    };
                    var preInstallSuccess = () => {
                        /* package will be cleaned up after success, on the native side */
                        invokeSuccessAndInstall();
                    };
                    var preInstallFailure = (preInstallError) => {
                        CodePushUtil.logError("Preinstall failure.", preInstallError);
                        var error = new Error("An error has occured while installing the package. " + CodePushUtil.getErrorMessage(preInstallError));
                        installError && installError(error);
                    };
                    NativeCodePush.preInstall({ startLocation: deployDir }).then(preInstallSuccess, preInstallFailure);
                }, (writeMetadataError) => {
                    installError && installError(writeMetadataError);
                });
            });
        }, installError);
    }
    static handleDeployment(newPackageLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            const manifestFile = {
                directory: Directory.Data,
                path: LocalPackage.DownloadUnzipDir + "/" + LocalPackage.DiffManifestFile
            };
            const isDiffUpdate = yield FileUtil.fileExists(manifestFile.directory, manifestFile.path);
            if (!(yield FileUtil.directoryExists(Directory.Data, LocalPackage.VersionsDir))) {
                // If directory not exists, create recursive folder
                yield Filesystem.mkdir({
                    path: LocalPackage.VersionsDir,
                    directory: Directory.Data,
                    recursive: true
                });
            }
            if (isDiffUpdate) {
                yield LocalPackage.handleDiffDeployment(newPackageLocation, manifestFile);
            }
            else {
                yield LocalPackage.handleCleanDeployment(newPackageLocation);
            }
            return { deployDir: newPackageLocation, isDiffUpdate };
        });
    }
    writeNewPackageMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = yield NativeAppInfo.getApplicationBuildTime().catch(buildTimeError => {
                CodePushUtil.logError("Could not get application build time. " + buildTimeError);
            });
            const appVersion = yield NativeAppInfo.getApplicationVersion().catch(appVersionError => {
                CodePushUtil.logError("Could not get application version." + appVersionError);
            });
            const currentPackageMetadata = {
                nativeBuildTime: timestamp,
                localPath: this.localPath,
                appVersion: appVersion,
                deploymentKey: this.deploymentKey,
                description: this.description,
                isMandatory: this.isMandatory,
                packageSize: this.packageSize,
                label: this.label,
                packageHash: this.packageHash,
                isFirstRun: false,
                failedInstall: false,
                install: undefined
            };
            return new Promise((resolve, reject) => {
                LocalPackage.writeCurrentPackageInformation(currentPackageMetadata, error => error ? reject(error) : resolve());
            });
        });
    }
    static handleCleanDeployment(newPackageLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            // no diff manifest
            const source = { directory: Directory.Data, path: LocalPackage.DownloadUnzipDir };
            const target = { directory: Directory.Data, path: newPackageLocation };
            // TODO: create destination directory if it doesn't exist
            return FileUtil.copyDirectoryEntriesTo(source, target);
        });
    }
    static copyCurrentPackage(newPackageLocation, ignoreList) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentPackagePath = yield new Promise(resolve => {
                LocalPackage.getPackage(LocalPackage.PackageInfoFile, (currentPackage) => resolve(currentPackage.localPath), () => resolve());
            });
            newPackageLocation = currentPackagePath ? newPackageLocation : newPackageLocation + "/public";
            // https://github.com/ionic-team/capacitor/pull/2514 Directory.Application variable was removed. (TODO - for check)
            const source = currentPackagePath ? { directory: Directory.Data, path: currentPackagePath } : { directory: Directory.Data, path: "public" };
            const target = { directory: Directory.Data, path: newPackageLocation };
            return FileUtil.copyDirectoryEntriesTo(source, target, ignoreList);
        });
    }
    static handleDiffDeployment(newPackageLocation, diffManifest) {
        return __awaiter(this, void 0, void 0, function* () {
            let manifest;
            try {
                yield LocalPackage.copyCurrentPackage(newPackageLocation, [".codepushrelease"]);
                yield LocalPackage.handleCleanDeployment(newPackageLocation);
                /* delete files mentioned in the manifest */
                const content = yield FileUtil.readFile(diffManifest.directory, diffManifest.path);
                manifest = JSON.parse(content);
                yield FileUtil.deleteEntriesFromDataDirectory(newPackageLocation, manifest.deletedFiles);
            }
            catch (error) {
                throw new Error("Cannot perform diff-update.");
            }
        });
    }
    /**
    * Writes the given local package information to the current package information file.
    * @param packageInfoMetadata The object to serialize.
    * @param callback In case of an error, this function will be called with the error as the fist parameter.
    */
    static writeCurrentPackageInformation(packageInfoMetadata, callback) {
        var content = JSON.stringify(packageInfoMetadata);
        FileUtil.writeStringToDataFile(content, LocalPackage.RootDir + "/" + LocalPackage.PackageInfoFile, true, callback);
    }
    /**
     * Backs up the current package information to the old package information file.
     * This file is used for recovery in case of an update going wrong.
     * @param callback In case of an error, this function will be called with the error as the fist parameter.
     */
    static backupPackageInformationFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const source = {
                directory: Directory.Data,
                path: LocalPackage.RootDir + "/" + LocalPackage.PackageInfoFile
            };
            const destination = {
                directory: Directory.Data,
                path: LocalPackage.RootDir + "/" + LocalPackage.OldPackageInfoFile
            };
            return FileUtil.copy(source, destination);
        });
    }
    /**
     * Get the previous package information.
     *
     * @param packageSuccess Callback invoked with the old package information.
     * @param packageError Optional callback invoked in case of an error.
     */
    static getOldPackage(packageSuccess, packageError) {
        LocalPackage.getPackage(LocalPackage.OldPackageInfoFile, packageSuccess, packageError);
    }
    /**
     * Reads package information from a given file.
     *
     * @param packageFile The package file name.
     * @param packageSuccess Callback invoked with the package information.
     * @param packageError Optional callback invoked in case of an error.
     */
    static getPackage(packageFile, packageSuccess, packageError) {
        return __awaiter(this, void 0, void 0, function* () {
            var handleError = (e) => {
                packageError && packageError(new Error("Cannot read package information. " + CodePushUtil.getErrorMessage(e)));
            };
            try {
                const content = yield FileUtil.readDataFile(LocalPackage.RootDir + "/" + packageFile);
                const packageInfo = JSON.parse(content);
                LocalPackage.getLocalPackageFromMetadata(packageInfo).then(packageSuccess, packageError);
            }
            catch (e) {
                handleError(e);
            }
        });
    }
    static getLocalPackageFromMetadata(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!metadata) {
                throw new Error("Invalid package metadata.");
            }
            const installFailed = yield NativeAppInfo.isFailedUpdate(metadata.packageHash);
            const isFirstRun = yield NativeAppInfo.isFirstRun(metadata.packageHash);
            const localPackage = new LocalPackage();
            localPackage.appVersion = metadata.appVersion;
            localPackage.deploymentKey = metadata.deploymentKey;
            localPackage.description = metadata.description;
            localPackage.isMandatory = metadata.isMandatory;
            localPackage.failedInstall = installFailed;
            localPackage.isFirstRun = isFirstRun;
            localPackage.label = metadata.label;
            localPackage.localPath = metadata.localPath;
            localPackage.packageHash = metadata.packageHash;
            localPackage.packageSize = metadata.packageSize;
            return localPackage;
        });
    }
    static getCurrentOrDefaultPackage() {
        return LocalPackage.getPackageInfoOrDefault(LocalPackage.PackageInfoFile);
    }
    static getOldOrDefaultPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            return LocalPackage.getPackageInfoOrDefault(LocalPackage.OldPackageInfoFile);
        });
    }
    static getPackageInfoOrDefault(packageFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const packageFailure = () => __awaiter(this, void 0, void 0, function* () {
                    /**
                     * For the default package we need the app version,
                     * and ideally the hash of the binary contents.
                     */
                    let appVersion;
                    try {
                        appVersion = yield NativeAppInfo.getApplicationVersion();
                    }
                    catch (appVersionError) {
                        CodePushUtil.logError("Could not get application version." + appVersionError);
                        reject(appVersionError);
                        return;
                    }
                    const defaultPackage = new LocalPackage();
                    defaultPackage.appVersion = appVersion;
                    try {
                        defaultPackage.packageHash = yield NativeAppInfo.getBinaryHash();
                    }
                    catch (binaryHashError) {
                        CodePushUtil.logError("Could not get binary hash." + binaryHashError);
                    }
                    resolve(defaultPackage);
                });
                LocalPackage.getPackage(packageFile, resolve, packageFailure);
            });
        });
    }
    static getPackageInfoOrNull(packageFile, packageSuccess, packageError) {
        LocalPackage.getPackage(packageFile, packageSuccess, packageSuccess.bind(null, null));
    }
    /**
     * Returns the default options for the CodePush install operation.
     * If the options are not defined yet, the static DefaultInstallOptions member will be instantiated.
     */
    static getDefaultInstallOptions() {
        if (!LocalPackage.DefaultInstallOptions) {
            LocalPackage.DefaultInstallOptions = {
                installMode: InstallMode.ON_NEXT_RESTART,
                minimumBackgroundDuration: 0,
                mandatoryInstallMode: InstallMode.IMMEDIATE
            };
        }
        return LocalPackage.DefaultInstallOptions;
    }
}
LocalPackage.RootDir = "codepush";
LocalPackage.DownloadDir = LocalPackage.RootDir + "/download";
LocalPackage.DownloadUnzipDir = LocalPackage.DownloadDir + "/unzipped";
LocalPackage.DeployDir = LocalPackage.RootDir + "/deploy";
LocalPackage.VersionsDir = LocalPackage.DeployDir + "/versions";
LocalPackage.PackageUpdateFileName = "update.zip";
LocalPackage.PackageInfoFile = "currentPackage.json";
LocalPackage.OldPackageInfoFile = "oldPackage.json";
LocalPackage.DiffManifestFile = "hotcodepush.json";
//# sourceMappingURL=localPackage.js.map