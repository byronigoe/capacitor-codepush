
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const core_1 = require("@capacitor/core");
const { Filesystem } = core_1.Plugins;
class FileUtil {
    static async directoryExists(directory, path) {
        try {
            const statResult = await Filesystem.stat({ directory, path });
            return statResult.type === "directory";
        }
        catch (error) {
            return false;
        }
    }
    static writeStringToDataFile(content, path, createIfNotExists, callback) {
        FileUtil.writeStringToFile(content, core_1.FilesystemDirectory.Data, path, createIfNotExists, callback);
    }
    static async fileExists(directory, path) {
        try {
            const statResult = await Filesystem.stat({ directory, path });
            return statResult.type === "file";
        }
        catch (error) {
            return false;
        }
    }
    static async cleanDataDirectory(path) {
        if (await FileUtil.dataDirectoryExists(path)) {
            await FileUtil.deleteDataDirectory(path);
        }
        await Filesystem.mkdir({ directory: core_1.FilesystemDirectory.Data, path, createIntermediateDirectories: true });
        const appDir = await Filesystem.getUri({ directory: core_1.FilesystemDirectory.Data, path });
        return appDir.uri;
    }
    static async getUri(fsDir, path) {
        const result = await Filesystem.getUri({ directory: fsDir, path });
        return result.uri;
    }
    static getDataUri(path) {
        return FileUtil.getUri(core_1.FilesystemDirectory.Data, path);
    }
    static dataDirectoryExists(path) {
        return FileUtil.directoryExists(core_1.FilesystemDirectory.Data, path);
    }
    static async copyDirectoryEntriesTo(sourceDir, destinationDir, ignoreList = []) {
        if (ignoreList.indexOf(".DS_Store") === -1) {
            ignoreList.push(".DS_Store");
        }
        if (ignoreList.indexOf("__MACOSX") === -1) {
            ignoreList.push("__MACOSX");
        }
        return null;
    }
    static async copyFile(source, destination) {
    }
    static async deleteDataDirectory(path) {
        return Filesystem.rmdir({ directory: core_1.FilesystemDirectory.Data, path, recursive: true }).then(() => null);
    }
    static async deleteEntriesFromDataDirectory(dirPath, filesToDelete) {
        for (const file of filesToDelete) {
            const path = dirPath + "/" + file;
            const fileExists = await FileUtil.fileExists(core_1.FilesystemDirectory.Data, path);
            if (!fileExists)
                continue;
            try {
                await Filesystem.deleteFile({ directory: core_1.FilesystemDirectory.Data, path });
            }
            catch (error) {
                console.log("Could not delete file: " + path);
            }
        }
    }
    static async writeStringToFile(data, directory, path, createIfNotExists, callback) {
        try {
            await Filesystem.writeFile({ directory, path, data, encoding: core_1.FilesystemEncoding.UTF8 });
            callback(null, null);
        }
        catch (error) {
            callback(new Error("Could write the current package information file. Error code: " + error.code), null);
        }
    }
    static async readFile(directory, path) {
        const result = await Filesystem.readFile({ directory, path, encoding: core_1.FilesystemEncoding.UTF8 });
        return result.data;
    }
    static readDataFile(path) {
        return FileUtil.readFile(core_1.FilesystemDirectory.Data, path);
    }
}
module.exports = FileUtil;
