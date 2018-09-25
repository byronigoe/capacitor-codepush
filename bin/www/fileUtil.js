
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
class FileUtil {
    static directoryExists(rootUri, path, callback) {
        FileUtil.getDirectory(rootUri, path, false, (error, dirEntry) => {
            var dirExists = !error && !!dirEntry;
            callback(null, dirExists);
        });
    }
    static fileErrorToError(fileError, message) {
        return new Error((message ? message : "An error has occurred while performing the operation. ") + " Error code: " + fileError.code);
    }
    static getDataDirectory(path, createIfNotExists, callback) {
        FileUtil.getDirectory(cordova.file.dataDirectory, path, createIfNotExists, callback);
    }
    static writeStringToDataFile(content, path, fileName, createIfNotExists, callback) {
        FileUtil.writeStringToFile(content, cordova.file.dataDirectory, path, fileName, createIfNotExists, callback);
    }
    static getApplicationDirectory(path, callback) {
        FileUtil.getApplicationEntry(path, callback);
    }
    static getApplicationFile(path, callback) {
        FileUtil.getApplicationEntry(path, callback);
    }
    static getOrCreateFile(parent, path, createIfNotExists, success, fail) {
        var failFirst = (error) => {
            if (!createIfNotExists) {
                fail(error);
            }
            else {
                parent.getFile(path, { create: true, exclusive: false }, success, fail);
            }
        };
        parent.getFile(path, { create: false, exclusive: false }, success, failFirst);
    }
    static getFile(rootUri, path, fileName, createIfNotExists, callback) {
        FileUtil.getDirectory(rootUri, path, createIfNotExists, (error, directoryEntry) => {
            if (error) {
                callback(error, null);
            }
            else {
                FileUtil.getOrCreateFile(directoryEntry, fileName, createIfNotExists, (entry) => { callback(null, entry); }, (error) => { callback(FileUtil.fileErrorToError(error), null); });
            }
        });
    }
    static getDataFile(path, fileName, createIfNotExists, callback) {
        FileUtil.getFile(cordova.file.dataDirectory, path, fileName, createIfNotExists, callback);
    }
    static fileExists(rootUri, path, fileName, callback) {
        FileUtil.getFile(rootUri, path, fileName, false, (error, fileEntry) => {
            var exists = !error && !!fileEntry;
            callback(null, exists);
        });
    }
    static getDirectory(rootUri, path, createIfNotExists, callback) {
        var pathArray = path.split("/");
        var currentIndex = 0;
        var appDirError = (error) => {
            callback(new Error("Could not get application subdirectory. Error code: " + error.code), null);
        };
        var rootDirSuccess = (appDir) => {
            if (!createIfNotExists) {
                appDir.getDirectory(path, { create: false, exclusive: false }, (directoryEntry) => { callback(null, directoryEntry); }, appDirError);
            }
            else {
                if (currentIndex >= pathArray.length) {
                    callback(null, appDir);
                }
                else {
                    var currentPath = pathArray[currentIndex];
                    currentIndex++;
                    if (currentPath) {
                        FileUtil.getOrCreateSubDirectory(appDir, currentPath, createIfNotExists, rootDirSuccess, appDirError);
                    }
                    else {
                        rootDirSuccess(appDir);
                    }
                }
            }
        };
        window.resolveLocalFileSystemURL(rootUri, rootDirSuccess, appDirError);
    }
    static dataDirectoryExists(path, callback) {
        FileUtil.directoryExists(cordova.file.dataDirectory, path, callback);
    }
    static copyDirectoryEntriesTo(sourceDir, destinationDir, ignoreList, callback) {
        if (ignoreList.indexOf(".DS_Store") === -1) {
            ignoreList.push(".DS_Store");
        }
        if (ignoreList.indexOf("__MACOSX") === -1) {
            ignoreList.push("__MACOSX");
        }
        var fail = (error) => {
            callback(FileUtil.fileErrorToError(error), null);
        };
        var success = (entries) => {
            var i = 0;
            var copyOne = () => {
                if (i < entries.length) {
                    var nextEntry = entries[i++];
                    if (ignoreList.indexOf(nextEntry.name) > 0) {
                        copyOne();
                    }
                    else {
                        var entryAlreadyInDestination = (destinationEntry) => {
                            var replaceError = (fileError) => {
                                callback(new Error("Error during entry replacement. Error code: " + fileError.code), null);
                            };
                            if (destinationEntry.isDirectory) {
                                FileUtil.copyDirectoryEntriesTo(nextEntry, destinationEntry, ignoreList, (error) => {
                                    if (error) {
                                        callback(error, null);
                                    }
                                    else {
                                        copyOne();
                                    }
                                });
                            }
                            else {
                                var fileEntry = destinationEntry;
                                fileEntry.remove(() => {
                                    nextEntry.copyTo(destinationDir, nextEntry.name, copyOne, fail);
                                }, replaceError);
                            }
                        };
                        var entryNotInDestination = (error) => {
                            nextEntry.copyTo(destinationDir, nextEntry.name, copyOne, fail);
                        };
                        FileUtil.entryExistsInDirectory(nextEntry, destinationDir, entryAlreadyInDestination, entryNotInDestination);
                    }
                }
                else {
                    callback(null, null);
                }
            };
            copyOne();
        };
        var directoryReader = sourceDir.createReader();
        directoryReader.readEntries(success, fail);
    }
    static entryExistsInDirectory(entry, destinationDir, exists, doesNotExist) {
        var options = { create: false, exclusive: false };
        if (entry.isDirectory) {
            destinationDir.getDirectory(entry.name, options, exists, doesNotExist);
        }
        else {
            destinationDir.getFile(entry.name, options, exists, doesNotExist);
        }
    }
    static deleteDirectory(dirLocation, deleteDirCallback) {
        FileUtil.getDataDirectory(dirLocation, false, (oldDirError, dirToDelete) => {
            if (oldDirError) {
                deleteDirCallback(oldDirError, null);
            }
            else {
                var win = () => { deleteDirCallback(null, null); };
                var fail = (e) => { deleteDirCallback(FileUtil.fileErrorToError(e), null); };
                dirToDelete.removeRecursively(win, fail);
            }
        });
    }
    static deleteEntriesFromDataDirectory(dirPath, filesToDelete, callback) {
        FileUtil.getDataDirectory(dirPath, false, (error, rootDir) => {
            if (error) {
                callback(error, null);
            }
            else {
                var i = 0;
                var deleteOne = () => {
                    if (i < filesToDelete.length) {
                        var continueDeleting = () => {
                            i++;
                            deleteOne();
                        };
                        var fail = (error) => {
                            console.log("Could not delete file: " + filesToDelete[i]);
                            continueDeleting();
                        };
                        var success = (entry) => {
                            entry.remove(continueDeleting, fail);
                        };
                        rootDir.getFile(filesToDelete[i], { create: false, exclusive: false }, success, fail);
                    }
                    else {
                        callback(null, null);
                    }
                };
                deleteOne();
            }
        });
    }
    static writeStringToFile(content, rootUri, path, fileName, createIfNotExists, callback) {
        var gotFile = (fileEntry) => {
            fileEntry.createWriter((writer) => {
                writer.onwriteend = (ev) => {
                    callback(null, null);
                };
                writer.onerror = (ev) => {
                    callback(writer.error, null);
                };
                writer.write(content);
            }, (error) => {
                callback(new Error("Could write the current package information file. Error code: " + error.code), null);
            });
        };
        FileUtil.getFile(rootUri, path, fileName, createIfNotExists, (error, fileEntry) => {
            if (error) {
                callback(error, null);
            }
            else {
                gotFile(fileEntry);
            }
        });
    }
    static readFileEntry(fileEntry, callback) {
        fileEntry.file((file) => {
            var fileReader = new FileReader();
            fileReader.onloadend = (ev) => {
                callback(null, ev.target.result);
            };
            fileReader.onerror = (ev) => {
                callback(new Error("Could not get file. Error: " + ev.error), null);
            };
            fileReader.readAsText(file);
        }, (error) => {
            callback(new Error("Could not get file. Error code: " + error.code), null);
        });
    }
    static readFile(rootUri, path, fileName, callback) {
        FileUtil.getFile(rootUri, path, fileName, false, (error, fileEntry) => {
            if (error) {
                callback(error, null);
            }
            else {
                FileUtil.readFileEntry(fileEntry, callback);
            }
        });
    }
    static readDataFile(path, fileName, callback) {
        FileUtil.readFile(cordova.file.dataDirectory, path, fileName, callback);
    }
    static getApplicationEntry(path, callback) {
        var success = (entry) => {
            callback(null, entry);
        };
        var fail = (error) => {
            callback(FileUtil.fileErrorToError(error), null);
        };
        window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + path, success, fail);
    }
    static getOrCreateSubDirectory(parent, path, createIfNotExists, success, fail) {
        var failFirst = (error) => {
            if (!createIfNotExists) {
                fail(error);
            }
            else {
                parent.getDirectory(path, { create: true, exclusive: false }, success, fail);
            }
        };
        parent.getDirectory(path, { create: false, exclusive: false }, success, failFirst);
    }
}
module.exports = FileUtil;
