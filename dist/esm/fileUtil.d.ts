import { Directory, GetUriOptions } from "@capacitor/filesystem";
import { Callback } from "./callbackUtil";
/**
 * File utilities for CodePush.
 */
export declare class FileUtil {
    static directoryExists(directory: Directory, path: string): Promise<boolean>;
    static writeStringToDataFile(content: string, path: string, createIfNotExists: boolean, callback: Callback<void>): void;
    static fileExists(directory: Directory, path: string): Promise<boolean>;
    /**
     * Makes sure the given directory exists and is empty.
     */
    static cleanDataDirectory(path: string): Promise<string>;
    static getUri(fsDir: Directory, path: string): Promise<string>;
    static getDataUri(path: string): Promise<string>;
    static dataDirectoryExists(path: string): Promise<boolean>;
    static copyDirectoryEntriesTo(sourceDir: GetUriOptions, destinationDir: GetUriOptions, ignoreList?: string[]): Promise<void>;
    static copy(source: GetUriOptions, destination: GetUriOptions): Promise<void>;
    /**
     * Recursively deletes the contents of a directory.
     */
    static deleteDataDirectory(path: string): Promise<void>;
    /**
     * Deletes a given set of files from a directory.
     */
    static deleteEntriesFromDataDirectory(dirPath: string, filesToDelete: string[]): Promise<void>;
    /**
     * Writes a string to a file.
     */
    static writeStringToFile(data: string, directory: Directory, path: string, createIfNotExists: boolean, callback: Callback<void>): Promise<void>;
    static readFile(directory: Directory, path: string): Promise<string>;
    static readDataFile(path: string): Promise<string>;
}
