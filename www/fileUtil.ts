/// <reference path="../typings/codePush.d.ts" />

"use strict";

import { FilesystemDirectory, FilesystemEncoding, GetUriOptions, Plugins } from "@capacitor/core";

const { Filesystem } = Plugins;

/**
 * File utilities for CodePush.
 */
class FileUtil {
    public static async directoryExists(directory: FilesystemDirectory, path: string): Promise<boolean> {
        try {
            const statResult = await Filesystem.stat({directory, path});
            return statResult.type === "directory";
        } catch (error) {
            return false;
        }
    }

    public static fileErrorToError(fileError: FileError, message?: string): Error {
        return new Error((message ? message : "An error has occurred while performing the operation. ") + " Error code: " + fileError.code);
    }

    public static getDataDirectory(path: string, createIfNotExists: boolean, callback: Callback<string>): void {
        FileUtil.getDirectory(FilesystemDirectory.Data, path, createIfNotExists, callback);
    }

    public static writeStringToDataFile(content: string, path: string, createIfNotExists: boolean, callback: Callback<void>): void {
        FileUtil.writeStringToFile(content, FilesystemDirectory.Data, path, createIfNotExists, callback);
    }

    public static getApplicationDirectory(path: string, callback: Callback<DirectoryEntry>): void {
        FileUtil.getApplicationEntry<DirectoryEntry>(path, callback);
    }

    public static getOrCreateFile(parent: DirectoryEntry, path: string, createIfNotExists: boolean, success: (result: FileEntry) => void, fail: (error: FileError) => void): void {
        var failFirst = (error: FileError) => {
            if (!createIfNotExists) {
                fail(error);
            } else {
                parent.getFile(path, { create: true, exclusive: false }, success, fail);
            }
        };

        /* check if the file exists first - getFile fails if the file exists and the create flag is set to true */
        parent.getFile(path, { create: false, exclusive: false }, success, failFirst);
    }

    public static getFile(fsDir: FilesystemDirectory, path: string, fileName: string, createIfNotExists: boolean, callback: Callback<FileEntry>): void {
        FileUtil.getDirectory(fsDir, path, createIfNotExists, (error: Error, directoryEntry: DirectoryEntry) => {
            if (error) {
                callback(error, null);
            } else {
                FileUtil.getOrCreateFile(directoryEntry, fileName, createIfNotExists,
                    (entry: FileEntry) => { callback(null, entry); },
                    (error: FileError) => { callback(FileUtil.fileErrorToError(error), null); });
            }
        });
    }

    public static getDataFile(path: string, fileName: string, createIfNotExists: boolean, callback: Callback<FileEntry>): void {
        FileUtil.getFile(FilesystemDirectory.Data, path, fileName, createIfNotExists, callback);
    }

    public static async fileExists(directory: FilesystemDirectory, path: string): Promise<boolean> {
        try {
            const statResult = await Filesystem.stat({directory, path});
            return statResult.type === "file";
        } catch (error) {
            return false;
        }
    }

    /**
     * Makes sure the given directory exists and is empty.
     */
    public static async cleanDataDirectory(path: string): Promise<string> {
        if (await FileUtil.dataDirectoryExists(path)) {
            await FileUtil.deleteDataDirectory(path);
        }

        await Filesystem.mkdir({directory: FilesystemDirectory.Data, path, createIntermediateDirectories: true})
        const appDir = await Filesystem.getUri({directory: FilesystemDirectory.Data, path});
        return appDir.uri;
    }

    public static async getUri(fsDir: FilesystemDirectory, path: string): Promise<string> {
        const result = await Filesystem.getUri({directory: fsDir, path});
        return result.uri;
    }

    public static getDataUri(path: string): Promise<string> {
        return FileUtil.getUri(FilesystemDirectory.Data, path);
    }

    /**
     * Gets a DirectoryEntry based on a path.
     */
    public static async getDirectory(fsDir: FilesystemDirectory, path: string, createIfNotExists: boolean, callback: Callback<string>): Promise<void> {
        try {
            const appDir = await Filesystem.getUri({directory: fsDir, path});
            callback(null, appDir.uri);
            return;
        } catch (error) {
            if (!createIfNotExists) {
                callback(new Error("Could not get application subdirectory. Error code: " + error.code), null);
                return;
            }
        }

        // directory does not exist so we need to create it
        try {
            await Filesystem.mkdir({directory: fsDir, path, createIntermediateDirectories: true})
            const appDir = await Filesystem.getUri({directory: fsDir, path});
            callback(null, appDir.uri);
        } catch (error) {
            callback(new Error("Could not create application subdirectory. Error code: " + error.code), null);
        }
    }

    public static dataDirectoryExists(path: string): Promise<boolean> {
        return FileUtil.directoryExists(FilesystemDirectory.Data, path);
    }

    public static async copyDirectoryEntriesTo(sourceDir: GetUriOptions, destinationDir: GetUriOptions, ignoreList: string[] = []): Promise<void> {
        /*
            Native-side exception occurs while trying to copy “.DS_Store” and “__MACOSX” entries generated by macOS, so just skip them
        */
        if (ignoreList.indexOf(".DS_Store") === -1){
            ignoreList.push(".DS_Store");
        }
        if (ignoreList.indexOf("__MACOSX") === -1){
            ignoreList.push("__MACOSX");
        }

        // TODO: implement recursive directory copy natively in capacitor
        return null
    }

    /**
     * Checks if an entry already exists in a given directory.
     */
    public static entryExistsInDirectory(entry: Entry, destinationDir: DirectoryEntry, exists: SuccessCallback<Entry>, doesNotExist: { (error: FileError): void; }): void {
        var options: Flags = { create: false, exclusive: false };

        if (entry.isDirectory) {
            destinationDir.getDirectory(entry.name, options, exists, doesNotExist);
        } else {
            destinationDir.getFile(entry.name, options, exists, doesNotExist);
        }
    }

    /**
     * Recursively deletes the contents of a directory.
     */
    public static async deleteDataDirectory(path: string): Promise<void> {
        return Filesystem.rmdir({directory: FilesystemDirectory.Data, path, recursive: true}).then(() => null);
    }

    /**
     * Deletes a given set of files from a directory.
     */
    public static async deleteEntriesFromDataDirectory(dirPath: string, filesToDelete: string[]): Promise<void> {
        for (const file of filesToDelete) {
            const path = dirPath + "/" + file;
            const fileExists = await FileUtil.fileExists(FilesystemDirectory.Data, path);
            if (!fileExists) continue;

            try {
                await Filesystem.deleteFile({directory: FilesystemDirectory.Data, path});
            } catch (error) {
                /* If delete fails, silently continue */
                console.log("Could not delete file: " + path);
            }
        }
    }

    /**
     * Writes a string to a file.
     */
    public static async writeStringToFile(data: string, directory: FilesystemDirectory, path: string, createIfNotExists: boolean, callback: Callback<void>): Promise<void> {
        try {
            await Filesystem.writeFile({directory, path, data, encoding: FilesystemEncoding.UTF8})
            callback(null, null);
        } catch(error) {
            callback(new Error("Could write the current package information file. Error code: " + error.code), null);
        }
    }

    public static readFileEntry(fileEntry: FileEntry, callback: Callback<string>): void {
        fileEntry.file((file: File) => {
            var fileReader = new FileReader();
            fileReader.onloadend = (ev: any) => {
                callback(null, ev.target.result);
            };

            fileReader.onerror = (ev: any) => {
                callback(new Error("Could not get file. Error: " + ev.error), null);
            };

            fileReader.readAsText(file);
        }, (error: FileError) => {
            callback(new Error("Could not get file. Error code: " + error.code), null);
        });
    }

    public static async readFile(directory: FilesystemDirectory, path: string): Promise<string> {
        const result = await Filesystem.readFile({directory, path, encoding: FilesystemEncoding.UTF8});
        return result.data;
    }

    public static readDataFile(path: string): Promise<string> {
        return FileUtil.readFile(FilesystemDirectory.Data, path);
    }

    private static getApplicationEntry<T extends Entry>(path: string, callback: Callback<T>): void {
        var success = (entry: T) => {
            callback(null, entry);
        };

        var fail = (error: FileError) => {
            callback(FileUtil.fileErrorToError(error), null);
        };

        // TODO: implement me
        window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + path, success, fail);
    }
}

export = FileUtil;
