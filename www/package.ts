/// <reference path="../typings/codePush.d.ts" />

/**
 * Base class for CodePush packages.
 */
class Package implements IPackage {
    deploymentKey: string;
    description: string;
    label: string;
    appVersion: string;
    isMandatory: boolean;
    packageHash: string;
    packageSize: number;
    failedInstall: boolean;
}

export = Package;
