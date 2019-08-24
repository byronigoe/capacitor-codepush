
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const core_1 = require("@capacitor/core");
const capacitor_zip_1 = require("capacitor-zip");
const installMode_1 = require("./installMode");
const Package = require("./package");
const NativeAppInfo = require("./nativeAppInfo");
const FileUtil = require("./fileUtil");
const CodePushUtil = require("./codePushUtil");
const Sdk = require("./sdk");
const NativeCodePush = core_1.Plugins.CodePush;
class LocalPackage extends Package {
    async install(installOptions) {
        return new Promise(async (resolve, reject) => {
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
                    unzipDir = await FileUtil.cleanDataDirectory(LocalPackage.DownloadUnzipDir);
                }
                catch (error) {
                    installError(error);
                    return;
                }
                try {
                    const zip = new capacitor_zip_1.Zip();
                    await zip.unZip({ source: this.localPath, destination: unzipDir });
                }
                catch (unzipError) {
                    installError(new Error("Could not unzip package" + CodePushUtil.getErrorMessage(unzipError)));
                    return;
                }
                try {
                    const newPackageLocation = LocalPackage.VersionsDir + "/" + this.packageHash;
                    const deploymentResult = await LocalPackage.handleDeployment(newPackageLocation);
                    await this.verifyPackage(deploymentResult);
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
                        this.verifyHash(deployDir, this.packageHash, verificationFail, resolve);
                    }
                    else {
                        if (deploymentResult.isDiffUpdate) {
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
                isSignatureVerificationEnabled = (publicKey !== null);
                this.getSignatureFromUpdate(deploymentResult.deployDir, (error, signature) => {
                    if (error) {
                        reject(new Error("Error reading signature from update. " + error));
                        return;
                    }
                    isSignatureAppearedInBundle = (signature !== null);
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
    async getSignatureFromUpdate(deployDir, callback) {
        const filePath = deployDir + "/www/.codepushrelease";
        if (!await FileUtil.fileExists(core_1.FilesystemDirectory.Data, filePath)) {
            callback(null, null);
            return;
        }
        try {
            const signature = await FileUtil.readFile(core_1.FilesystemDirectory.Data, filePath);
            callback(null, signature);
        }
        catch (error) {
            callback(error, null);
        }
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
        async function backupPackageInformationFileIfNeeded(backupIfNeededDone) {
            const pendingUpdate = await NativeAppInfo.isPendingUpdate();
            if (pendingUpdate) {
                backupIfNeededDone(null, null);
            }
            else {
                try {
                    await LocalPackage.backupPackageInformationFile();
                    backupIfNeededDone(null, null);
                }
                catch (err) {
                    backupIfNeededDone(err, null);
                }
            }
        }
        LocalPackage.getCurrentOrDefaultPackage().then((oldPackage) => {
            backupPackageInformationFileIfNeeded((backupError) => {
                this.writeNewPackageMetadata().then(() => {
                    var invokeSuccessAndInstall = () => {
                        CodePushUtil.logMessage("Install succeeded.");
                        var installModeToUse = this.isMandatory ? installOptions.mandatoryInstallMode : installOptions.installMode;
                        if (installModeToUse === installMode_1.default.IMMEDIATE) {
                            installSuccess && installSuccess(installModeToUse);
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
    static async handleDeployment(newPackageLocation) {
        const manifestFile = {
            directory: core_1.FilesystemDirectory.Data,
            path: LocalPackage.DownloadUnzipDir + "/" + LocalPackage.DiffManifestFile
        };
        const isDiffUpdate = await FileUtil.fileExists(manifestFile.directory, manifestFile.path);
        await isDiffUpdate
            ? LocalPackage.handleDiffDeployment(newPackageLocation, manifestFile)
            : LocalPackage.handleCleanDeployment(newPackageLocation);
        const deployDir = await FileUtil.getDataUri(newPackageLocation);
        return { deployDir, isDiffUpdate };
    }
    async writeNewPackageMetadata() {
        const timestamp = await NativeAppInfo.getApplicationBuildTime().catch(buildTimeError => {
            CodePushUtil.logError("Could not get application build time. " + buildTimeError);
        });
        const appVersion = await NativeAppInfo.getApplicationVersion().catch(appVersionError => {
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
    }
    static async handleCleanDeployment(newPackageLocation) {
        const source = { directory: core_1.FilesystemDirectory.Data, path: LocalPackage.DownloadUnzipDir };
        const target = { directory: core_1.FilesystemDirectory.Data, path: newPackageLocation };
        return FileUtil.copyDirectoryEntriesTo(source, target);
    }
    static async copyCurrentPackage(newPackageLocation, ignoreList) {
        const currentPackagePath = await new Promise(resolve => {
            LocalPackage.getPackage(LocalPackage.PackageInfoFile, (currentPackage) => resolve(currentPackage.localPath), () => resolve());
        });
        newPackageLocation = currentPackagePath ? newPackageLocation : newPackageLocation + "/www";
        const source = currentPackagePath ? { directory: core_1.FilesystemDirectory.Data, path: currentPackagePath } : { directory: core_1.FilesystemDirectory.Application, path: "www" };
        const target = { directory: core_1.FilesystemDirectory.Data, path: newPackageLocation };
        return FileUtil.copyDirectoryEntriesTo(source, target, ignoreList);
    }
    static async handleDiffDeployment(newPackageLocation, diffManifest) {
        let manifest = null;
        try {
            await LocalPackage.copyCurrentPackage(newPackageLocation, [".codepushrelease"]);
            await LocalPackage.handleCleanDeployment(newPackageLocation);
            const content = await FileUtil.readFile(diffManifest.directory, diffManifest.path);
            manifest = JSON.parse(content);
            await FileUtil.deleteEntriesFromDataDirectory(newPackageLocation, manifest.deletedFiles);
        }
        catch (error) {
            throw new Error("Cannot perform diff-update.");
        }
    }
    static writeCurrentPackageInformation(packageInfoMetadata, callback) {
        var content = JSON.stringify(packageInfoMetadata);
        FileUtil.writeStringToDataFile(content, LocalPackage.RootDir + "/" + LocalPackage.PackageInfoFile, true, callback);
    }
    static async backupPackageInformationFile() {
        const source = {
            directory: core_1.FilesystemDirectory.Data,
            path: LocalPackage.RootDir + "/" + LocalPackage.PackageInfoFile
        };
        const destination = {
            directory: core_1.FilesystemDirectory.Data,
            path: LocalPackage.RootDir + "/" + LocalPackage.OldPackageInfoFile
        };
        return FileUtil.copyFile(source, destination);
    }
    static getOldPackage(packageSuccess, packageError) {
        LocalPackage.getPackage(LocalPackage.OldPackageInfoFile, packageSuccess, packageError);
    }
    static async getPackage(packageFile, packageSuccess, packageError) {
        var handleError = (e) => {
            packageError && packageError(new Error("Cannot read package information. " + CodePushUtil.getErrorMessage(e)));
        };
        try {
            const content = await FileUtil.readDataFile(LocalPackage.RootDir + "/" + packageFile);
            const packageInfo = JSON.parse(content);
            LocalPackage.getLocalPackageFromMetadata(packageInfo).then(packageSuccess, packageError);
        }
        catch (e) {
            handleError(e);
        }
    }
    static async getLocalPackageFromMetadata(metadata) {
        if (!metadata) {
            throw new Error("Invalid package metadata.");
        }
        const installFailed = await NativeAppInfo.isFailedUpdate(metadata.packageHash);
        const isFirstRun = await NativeAppInfo.isFirstRun(metadata.packageHash);
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
    }
    static getCurrentOrDefaultPackage() {
        return LocalPackage.getPackageInfoOrDefault(LocalPackage.PackageInfoFile);
    }
    static async getOldOrDefaultPackage() {
        return LocalPackage.getPackageInfoOrDefault(LocalPackage.OldPackageInfoFile);
    }
    static async getPackageInfoOrDefault(packageFile) {
        return new Promise((resolve, reject) => {
            const packageFailure = async () => {
                let appVersion;
                try {
                    appVersion = await NativeAppInfo.getApplicationVersion();
                }
                catch (appVersionError) {
                    CodePushUtil.logError("Could not get application version." + appVersionError);
                    reject(appVersionError);
                    return;
                }
                const defaultPackage = new LocalPackage();
                defaultPackage.appVersion = appVersion;
                try {
                    defaultPackage.packageHash = await NativeAppInfo.getBinaryHash();
                }
                catch (binaryHashError) {
                    CodePushUtil.logError("Could not get binary hash." + binaryHashError);
                }
                resolve(defaultPackage);
            };
            LocalPackage.getPackage(packageFile, resolve, packageFailure);
        });
    }
    static getPackageInfoOrNull(packageFile, packageSuccess, packageError) {
        LocalPackage.getPackage(packageFile, packageSuccess, packageSuccess.bind(null, null));
    }
    static getDefaultInstallOptions() {
        if (!LocalPackage.DefaultInstallOptions) {
            LocalPackage.DefaultInstallOptions = {
                installMode: installMode_1.default.ON_NEXT_RESTART,
                minimumBackgroundDuration: 0,
                mandatoryInstallMode: installMode_1.default.IMMEDIATE
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
module.exports = LocalPackage;
