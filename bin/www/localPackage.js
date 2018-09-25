
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const Package = require("./package");
const NativeAppInfo = require("./nativeAppInfo");
const FileUtil = require("./fileUtil");
const CodePushUtil = require("./codePushUtil");
const Sdk = require("./sdk");
const installMode_1 = require("./installMode");
class LocalPackage extends Package {
    async install(installOptions) {
        return new Promise((resolve, reject) => {
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
                var newPackageLocation = LocalPackage.VersionsDir + "/" + this.packageHash;
                var newPackageUnzipped = function (unzipError) {
                    if (unzipError) {
                        installError && installError(new Error("Could not unzip package" + CodePushUtil.getErrorMessage(unzipError)));
                    }
                    else {
                        LocalPackage.handleDeployment(newPackageLocation, CodePushUtil.getNodeStyleCallbackFor(donePackageFileCopy, installError));
                    }
                };
                var donePackageFileCopy = (deploymentResult) => {
                    this.verifyPackage(deploymentResult, installError, () => {
                        packageVerified(deploymentResult.deployDir);
                    });
                };
                var packageVerified = (deployDir) => {
                    this.localPath = deployDir.fullPath;
                    this.finishInstall(deployDir, installOptions, resolve, installError);
                };
                FileUtil.getDataDirectory(LocalPackage.DownloadUnzipDir, false, (error, directoryEntry) => {
                    var unzipPackage = () => {
                        FileUtil.getDataDirectory(LocalPackage.DownloadUnzipDir, true, (innerError, unzipDir) => {
                            if (innerError) {
                                installError && installError(innerError);
                                return;
                            }
                            zip.unzip(this.localPath, unzipDir.toInternalURL(), newPackageUnzipped);
                        });
                    };
                    if (!error && !!directoryEntry) {
                        directoryEntry.removeRecursively(() => {
                            unzipPackage();
                        }, (cleanupError) => {
                            installError && installError(FileUtil.fileErrorToError(cleanupError));
                        });
                    }
                    else {
                        unzipPackage();
                    }
                });
            }
            catch (e) {
                installError && installError(new Error("An error occured while installing the package. " + CodePushUtil.getErrorMessage(e)));
            }
        });
    }
    verifyPackage(deploymentResult, installError, successCallback) {
        var deployDir = deploymentResult.deployDir;
        var verificationFail = (error) => {
            installError && installError(error);
        };
        var verify = (isSignatureVerificationEnabled, isSignatureAppearedInBundle, publicKey, signature) => {
            if (isSignatureVerificationEnabled) {
                if (isSignatureAppearedInBundle) {
                    this.verifyHash(deployDir, this.packageHash, verificationFail, () => {
                        this.verifySignature(deployDir, this.packageHash, publicKey, signature, verificationFail, successCallback);
                    });
                }
                else {
                    var errorMessage = "Error! Public key was provided but there is no JWT signature within app bundle to verify. " +
                        "Possible reasons, why that might happen: \n" +
                        "1. You've been released CodePush bundle update using version of CodePush CLI that is not support code signing.\n" +
                        "2. You've been released CodePush bundle update without providing --privateKeyPath option.";
                    installError && installError(new Error(errorMessage));
                }
            }
            else {
                if (isSignatureAppearedInBundle) {
                    CodePushUtil.logMessage("Warning! JWT signature exists in codepush update but code integrity check couldn't be performed because there is no public key configured. " +
                        "Please ensure that public key is properly configured within your application.");
                    this.verifyHash(deployDir, this.packageHash, verificationFail, successCallback);
                }
                else {
                    if (deploymentResult.isDiffUpdate) {
                        this.verifyHash(deployDir, this.packageHash, verificationFail, successCallback);
                    }
                    else {
                        successCallback();
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
                installError && installError(new Error("Error reading public key. " + error));
                return;
            }
            publicKey = publicKeyResult;
            isSignatureVerificationEnabled = (publicKey !== null);
            this.getSignatureFromUpdate(deploymentResult.deployDir, (error, signature) => {
                if (error) {
                    installError && installError(new Error("Error reading signature from update. " + error));
                    return;
                }
                isSignatureAppearedInBundle = (signature !== null);
                verify(isSignatureVerificationEnabled, isSignatureAppearedInBundle, publicKey, signature);
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
        cordova.exec(success, fail, "CodePush", "getPublicKey", []);
    }
    getSignatureFromUpdate(deployDir, callback) {
        var rootUri = cordova.file.dataDirectory;
        var path = deployDir.fullPath + '/www';
        var fileName = '.codepushrelease';
        FileUtil.fileExists(rootUri, path, fileName, (error, result) => {
            if (!result) {
                callback(null, null);
                return;
            }
            FileUtil.readFile(rootUri, path, fileName, (error, signature) => {
                if (error) {
                    callback(error, null);
                    return;
                }
                callback(null, signature);
            });
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
        CodePushUtil.logMessage("Verifying hash for folder path: " + deployDir.fullPath);
        cordova.exec(packageHashSuccess, packageHashFail, "CodePush", "getPackageHash", [deployDir.fullPath]);
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
        CodePushUtil.logMessage("Verifying signature for folder path: " + deployDir.fullPath);
        cordova.exec(decodeSignatureSuccess, decodeSignatureFail, "CodePush", "decodeSignature", [publicKey, signature]);
    }
    finishInstall(deployDir, installOptions, installSuccess, installError) {
        async function backupPackageInformationFileIfNeeded(backupIfNeededDone) {
            const pendingUpdate = await NativeAppInfo.isPendingUpdate();
            if (pendingUpdate) {
                backupIfNeededDone(null, null);
            }
            else {
                LocalPackage.backupPackageInformationFile(backupIfNeededDone);
            }
        }
        LocalPackage.getCurrentOrDefaultPackage().then((oldPackage) => {
            backupPackageInformationFileIfNeeded((backupError) => {
                this.writeNewPackageMetadata(deployDir).then(() => {
                    var invokeSuccessAndInstall = () => {
                        CodePushUtil.logMessage("Install succeeded.");
                        var installModeToUse = this.isMandatory ? installOptions.mandatoryInstallMode : installOptions.installMode;
                        if (installModeToUse === installMode_1.default.IMMEDIATE) {
                            installSuccess && installSuccess(installModeToUse);
                            cordova.exec(() => { }, () => { }, "CodePush", "install", [deployDir.fullPath,
                                installModeToUse.toString(), installOptions.minimumBackgroundDuration.toString()]);
                        }
                        else {
                            cordova.exec(() => { installSuccess && installSuccess(installModeToUse); }, () => { installError && installError(); }, "CodePush", "install", [deployDir.fullPath,
                                installModeToUse.toString(), installOptions.minimumBackgroundDuration.toString()]);
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
                    cordova.exec(preInstallSuccess, preInstallFailure, "CodePush", "preInstall", [deployDir.fullPath]);
                }, (writeMetadataError) => {
                    installError && installError(writeMetadataError);
                });
            });
        }, installError);
    }
    static handleDeployment(newPackageLocation, deployCallback) {
        FileUtil.getDataDirectory(newPackageLocation, true, (deployDirError, deployDir) => {
            FileUtil.getDataFile(LocalPackage.DownloadUnzipDir, LocalPackage.DiffManifestFile, false, (manifestError, diffManifest) => {
                if (!manifestError && !!diffManifest) {
                    LocalPackage.handleDiffDeployment(newPackageLocation, diffManifest, deployCallback);
                }
                else {
                    LocalPackage.handleCleanDeployment(newPackageLocation, (error) => {
                        deployCallback(error, { deployDir, isDiffUpdate: false });
                    });
                }
            });
        });
    }
    async writeNewPackageMetadata(deployDir) {
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
    static handleCleanDeployment(newPackageLocation, cleanDeployCallback) {
        FileUtil.getDataDirectory(newPackageLocation, true, (deployDirError, deployDir) => {
            FileUtil.getDataDirectory(LocalPackage.DownloadUnzipDir, false, (unzipDirErr, unzipDir) => {
                if (unzipDirErr || deployDirError) {
                    cleanDeployCallback(new Error("Could not copy new package."), null);
                }
                else {
                    FileUtil.copyDirectoryEntriesTo(unzipDir, deployDir, [], (copyError) => {
                        if (copyError) {
                            cleanDeployCallback(copyError, null);
                        }
                        else {
                            cleanDeployCallback(null, { deployDir, isDiffUpdate: false });
                        }
                    });
                }
            });
        });
    }
    static copyCurrentPackage(newPackageLocation, ignoreList, copyCallback) {
        var handleError = (e) => {
            copyCallback && copyCallback(e, null);
        };
        var doCopy = (currentPackagePath) => {
            var getCurrentPackageDirectory;
            if (currentPackagePath) {
                getCurrentPackageDirectory = (getCurrentPackageDirectoryCallback) => {
                    FileUtil.getDataDirectory(currentPackagePath, false, getCurrentPackageDirectoryCallback);
                };
            }
            else {
                newPackageLocation = newPackageLocation + "/www";
                getCurrentPackageDirectory = (getCurrentPackageDirectoryCallback) => {
                    FileUtil.getApplicationDirectory("www", getCurrentPackageDirectoryCallback);
                };
            }
            FileUtil.getDataDirectory(newPackageLocation, true, (deployDirError, deployDir) => {
                if (deployDirError) {
                    handleError(new Error("Could not acquire the source/destination folders. "));
                }
                else {
                    var success = (currentPackageDirectory) => {
                        FileUtil.copyDirectoryEntriesTo(currentPackageDirectory, deployDir, ignoreList, copyCallback);
                    };
                    var fail = (fileSystemError) => {
                        copyCallback && copyCallback(FileUtil.fileErrorToError(fileSystemError), null);
                    };
                    getCurrentPackageDirectory(CodePushUtil.getNodeStyleCallbackFor(success, fail));
                }
            });
        };
        var packageFailure = (error) => {
            doCopy();
        };
        var packageSuccess = (currentPackage) => {
            doCopy(currentPackage.localPath);
        };
        LocalPackage.getPackage(LocalPackage.PackageInfoFile, packageSuccess, packageFailure);
    }
    static handleDiffDeployment(newPackageLocation, diffManifest, diffCallback) {
        var handleError = (e) => {
            diffCallback(e, null);
        };
        LocalPackage.copyCurrentPackage(newPackageLocation, [".codepushrelease"], (currentPackageError) => {
            LocalPackage.handleCleanDeployment(newPackageLocation, (cleanDeployError) => {
                FileUtil.readFileEntry(diffManifest, (error, content) => {
                    if (error || currentPackageError || cleanDeployError) {
                        handleError(new Error("Cannot perform diff-update."));
                    }
                    else {
                        var manifest = JSON.parse(content);
                        FileUtil.deleteEntriesFromDataDirectory(newPackageLocation, manifest.deletedFiles, (deleteError) => {
                            FileUtil.getDataDirectory(newPackageLocation, true, (deployDirError, deployDir) => {
                                if (deleteError || deployDirError) {
                                    handleError(new Error("Cannot clean up deleted manifest files."));
                                }
                                else {
                                    diffCallback(null, { deployDir, isDiffUpdate: true });
                                }
                            });
                        });
                    }
                });
            });
        });
    }
    static writeCurrentPackageInformation(packageInfoMetadata, callback) {
        var content = JSON.stringify(packageInfoMetadata);
        FileUtil.writeStringToDataFile(content, LocalPackage.RootDir, LocalPackage.PackageInfoFile, true, callback);
    }
    static backupPackageInformationFile(callback) {
        var reportFileError = (error) => {
            callback(FileUtil.fileErrorToError(error), null);
        };
        var copyFile = (fileToCopy) => {
            fileToCopy.getParent((parent) => {
                fileToCopy.copyTo(parent, LocalPackage.OldPackageInfoFile, () => {
                    callback(null, null);
                }, reportFileError);
            }, reportFileError);
        };
        var gotFile = (error, currentPackageFile) => {
            if (error) {
                callback(error, null);
            }
            else {
                FileUtil.getDataFile(LocalPackage.RootDir, LocalPackage.OldPackageInfoFile, false, (error, oldPackageFile) => {
                    if (!error && !!oldPackageFile) {
                        oldPackageFile.remove(() => {
                            copyFile(currentPackageFile);
                        }, reportFileError);
                    }
                    else {
                        copyFile(currentPackageFile);
                    }
                });
            }
        };
        FileUtil.getDataFile(LocalPackage.RootDir, LocalPackage.PackageInfoFile, false, gotFile);
    }
    static getOldPackage(packageSuccess, packageError) {
        return LocalPackage.getPackage(LocalPackage.OldPackageInfoFile, packageSuccess, packageError);
    }
    static getPackage(packageFile, packageSuccess, packageError) {
        var handleError = (e) => {
            packageError && packageError(new Error("Cannot read package information. " + CodePushUtil.getErrorMessage(e)));
        };
        try {
            FileUtil.readDataFile(LocalPackage.RootDir, packageFile, (error, content) => {
                if (error) {
                    handleError(error);
                }
                else {
                    try {
                        var packageInfo = JSON.parse(content);
                        LocalPackage.getLocalPackageFromMetadata(packageInfo).then(packageSuccess, packageError);
                    }
                    catch (e) {
                        handleError(e);
                    }
                }
            });
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
