#import <Capacitor/Capacitor-Swift.h>
#import <Capacitor/Capacitor.h>
#import "CodePush.h"
#import "CodePushPackageMetadata.h"
#import "CodePushPackageManager.h"
#import "Utilities.h"
#import "InstallOptions.h"
#import "InstallMode.h"
#import "CodePushReportingManager.h"
#import "StatusReport.h"
#import "UpdateHashUtils.h"
#import "CodePushJWT.h"



@interface CodePushPlugin () <UIScrollViewDelegate>

@property (readwrite, assign, nonatomic) NSString* getServerURL;
@property (readwrite, assign, nonatomic) NSString* getDeploymentKey;
@property (readwrite, assign, nonatomic) NSString* getNativeBuildTime;
@property (readwrite, assign, nonatomic) NSString* getAppVersion;
@property (readwrite, assign, nonatomic) BOOL install;
@property (readwrite, assign, nonatomic) BOOL preInstall;
@property (readwrite, assign, nonatomic) BOOL isFailedUpdate;
@property (readwrite, assign, nonatomic) BOOL isFirstRun;
@property (readwrite, assign, nonatomic) BOOL isPendingUpdate;
@property (readwrite, assign, nonatomic) BOOL restartApplication;
@property (readwrite, assign, nonatomic) NSString* getBinaryHash;
@property (readwrite, assign, nonatomic) NSString* getPackageHash;
@property (nonatomic, readwrite) ResizePolicy decodeSignature;
@property (readwrite, assign, nonatomic) NSString* getPublicKey;

@end

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wprotocol"
// suppressing warnings of the type: "Class 'KeyboardPlugin' does not conform to protocol 'CAPBridgedPlugin'"
// protocol conformance for this class is implemented by a macro and clang isn't detecting that
@implementation CodePushPlugin

static NSString *specifiedServerPath = @"";
bool didUpdate = false;
bool pendingInstall = false;
NSDate* lastResignedDate;
NSString* const DeploymentKeyPreference = @"IOS_DEPLOY_KEY";
NSString* const PublicKeyPreference = @"IOS_PUBLIC_KEY";
StatusReport* rollbackStatusReport = nil;

- (void)getBinaryHash:(CAPPluginCall *)call {
    NSString* binaryHash = [CodePushPackageManager getCachedBinaryHash];
    if (binaryHash) {
        [call resolve: binaryHash]
    } else {
        NSError* error;
        binaryHash = [UpdateHashUtils getBinaryHash:&error];
        if (error) {
            // TODO: is it working?
            [call reject:@"An error occurred when trying to get the hash of the binary contents. " :(NSString * _Nullable) :error : error]
        } else {
            [CodePushPackageManager saveBinaryHash:binaryHash];
            [call resolve:binaryHash]
        }
    }
}

- (void)getPackageHash:(CAPPluginCall *)call {
    NSString *path = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    if (!path) {
        [call reject:@"No path supplied"];
    } else {
        path = [[[NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES)[0]
                stringByAppendingPathComponent:@"NoCloud"]
                stringByAppendingPathComponent:path]
                stringByAppendingPathComponent:@"www"];
        NSError *error;
        NSString *hash = [UpdateHashUtils getHashForPath:path error:&error];
        if (error) {
            [call reject:[NSString stringWithFormat:@"An error occured when trying to get the hash of %@. %@", path, error.description]];
        } else {
            [call resolve:hash];
        }
    }
}

- (void)getPublicKey:(CAPPluginCall *)call {
    NSString *publicKey = ((CDVViewController *) self.viewController).settings[PublicKeyPreference];
    [call resolve: publicKey];
}

- (void)decodeSignature:(CAPPluginCall *)call {
    NSString *publicKey = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];

    // remove BEGIN / END tags and line breaks from public key string
    publicKey = [publicKey stringByReplacingOccurrencesOfString:@"-----BEGIN PUBLIC KEY-----\n"
                                                     withString:@""];
    publicKey = [publicKey stringByReplacingOccurrencesOfString:@"-----END PUBLIC KEY-----"
                                                     withString:@""];
    publicKey = [publicKey stringByReplacingOccurrencesOfString:@"\n"
                                                     withString:@""];

    NSString *jwt = [command argumentAtIndex:1 withDefault:nil andClass:[NSString class]];

    id <JWTAlgorithmDataHolderProtocol> verifyDataHolder = [JWTAlgorithmRSFamilyDataHolder new]
            .keyExtractorType([JWTCryptoKeyExtractor publicKeyWithPEMBase64].type)
            .algorithmName(@"RS256")
            .secret(publicKey);
    JWTCodingBuilder *verifyBuilder = [JWTDecodingBuilder decodeMessage:jwt].addHolder(verifyDataHolder);
    JWTCodingResultType *verifyResult = verifyBuilder.result;
    if (verifyResult.successResult) {
        CPLog(@"JWT signature verification succeeded, payload content:  %@", verifyResult.successResult.payload);
        [call resolve:verifyResult.successResult.payload[@"contentHash"]];
    } else {
        [call resolve:[@"Signature verification failed: " stringByAppendingString:verifyResult.errorResult.error.description]];
    }
}

- (void)handleUnconfirmedInstall:(BOOL)navigate {
    if ([CodePushPackageManager installNeedsConfirmation]) {
        /* save reporting status */
        CodePushPackageMetadata* currentMetadata = [CodePushPackageManager getCurrentPackageMetadata];
        rollbackStatusReport = [[StatusReport alloc] initWithStatus:UPDATE_ROLLED_BACK
                                                           andLabel:currentMetadata.label
                                                      andAppVersion:currentMetadata.appVersion
                                                   andDeploymentKey:currentMetadata.deploymentKey];
        [CodePushPackageManager clearInstallNeedsConfirmation];
        [CodePushPackageManager revertToPreviousVersion];
        if (navigate) {
            CodePushPackageMetadata* currentMetadata = [CodePushPackageManager getCurrentPackageMetadata];
            bool revertSuccess = (nil != currentMetadata && [self loadPackage:currentMetadata.localPath]);
            if (!revertSuccess) {
                /* first update failed, go back to binary version */
                [self loadStoreVersion];
            }
        }
    }
}

- (void)notifyApplicationReady:(CAPPluginCall *)call {
    if ([CodePushPackageManager isBinaryFirstRun]) {
        // Report first run of a binary version app
        [CodePushPackageManager markBinaryFirstRunFlag];
        NSString* appVersion = [Utilities getApplicationVersion];
        NSString* deploymentKey = ((CDVViewController *)self.viewController).settings[DeploymentKeyPreference];
        StatusReport* statusReport = [[StatusReport alloc] initWithStatus:STORE_VERSION
                                                                 andLabel:nil
                                                            andAppVersion:appVersion
                                                         andDeploymentKey:deploymentKey];
        [CodePushReportingManager reportStatus:statusReport
                                   withWebView:self.webView];
    } else if ([CodePushPackageManager installNeedsConfirmation]) {
        // Report CodePush update installation that has not been confirmed yet
        CodePushPackageMetadata* currentMetadata = [CodePushPackageManager getCurrentPackageMetadata];
        StatusReport* statusReport = [[StatusReport alloc] initWithStatus:UPDATE_CONFIRMED
                                                                 andLabel:currentMetadata.label
                                                            andAppVersion:currentMetadata.appVersion
                                                         andDeploymentKey:currentMetadata.deploymentKey];
        [CodePushReportingManager reportStatus:statusReport
                                withWebView:self.webView];
    } else if (rollbackStatusReport) {
        // Report a CodePush update that rolled back
        [CodePushReportingManager reportStatus:rollbackStatusReport
                                   withWebView:self.webView];
        rollbackStatusReport = nil;
    } else if ([CodePushReportingManager hasFailedReport]) {
        // Previous status report failed, so try it again
        [CodePushReportingManager reportStatus:[CodePushReportingManager getAndClearFailedReport]
                                   withWebView:self.webView];
    }

    // Mark the update as confirmed and not requiring a rollback
    [CodePushPackageManager clearInstallNeedsConfirmation];
    [CodePushPackageManager cleanOldPackage];
    [call resolve];
}

- (void)install:(CAPPluginCall *)call {
    NSString* location = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    NSString* installModeString = [command argumentAtIndex:1 withDefault:IMMEDIATE andClass:[NSString class]];
    NSString* minimumBackgroundDurationString = [command argumentAtIndex:2 withDefault:0 andClass:[NSString class]];

    InstallOptions* options = [[InstallOptions alloc] init];
    [options setInstallMode:[installModeString intValue]];
    [options setMinimumBackgroundDuration:[minimumBackgroundDurationString intValue]];

    if ([options installMode] == IMMEDIATE) {
        if (nil == location) {
            [call reject: @"Cannot read the start URL."];
        }
        else {
            bool applied = [self loadPackage: location];
            if (applied) {
                [self markUpdate];
                [call resolve];
            }
            else {
                [call reject: @"An error happened during package install."];
            }
        }
    }
    else {
        /* install on restart or on resume */
        [CodePushPackageManager savePendingInstall:options];
        [call resolve];
    }
}

- (void)reportFailed:(CAPPluginCall *)call {
    NSDictionary* statusReportDict = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
    if (statusReportDict) {
        [CodePushReportingManager saveFailedReport:[[StatusReport alloc] initWithDictionary:statusReportDict]];
    }
    [call resolve];
}

- (void)reportSucceeded:(CAPPluginCall *)call {
    NSDictionary* statusReportDict = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
    if (statusReportDict) {
        [CodePushReportingManager saveSuccessfulReport:[[StatusReport alloc] initWithDictionary:statusReportDict]];
    }
    [call resolve];
}

- (void)restartApplication:(CAPPluginCall *)call {
    [call resolve];

    /* Callback before navigating */
    CodePushPackageMetadata* deployedPackageMetadata = [CodePushPackageManager getCurrentPackageMetadata];
    if (deployedPackageMetadata && deployedPackageMetadata.localPath && [self getStartPageURLForLocalPackage:deployedPackageMetadata.localPath]) {
        [self loadPackage: deployedPackageMetadata.localPath];
        InstallOptions* pendingInstall = [CodePushPackageManager getPendingInstall];
        if (pendingInstall) {
            [self markUpdate];
            [CodePushPackageManager clearPendingInstall];
        }
    }
    else {
        [self loadStoreVersion];
    }
}

- (void) markUpdate {
    didUpdate = YES;
    [CodePushPackageManager markInstallNeedsConfirmation];
}

- (void)preInstall:(CAPPluginCall *)call {
    NSString* location = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    if (nil == location) {
        [call reject: @"Cannot read the start URL."];
    }
    else {
        NSURL* URL = [self getStartPageURLForLocalPackage:location];
        if (URL) {
            [call resolve];
        }
        else {
            [call reject: @"Could not find start page in package."];
        }
    }
}

- (void)getServerURL:(CAPPluginCall *)call {
    [self sendResultForPreference:@"SERVER_URL" call:call];
}

- (void)getDeploymentKey:(CAPPluginCall *)call {
    [self sendResultForPreference:DeploymentKeyPreference call:call];
}

- (void)getNativeBuildTime:(CAPPluginCall *)call {
    [self.commandDelegate runInBackground:^{
        NSString* timeStamp = [Utilities getApplicationTimestamp];
        [call resolve: timeStamp];
    }];
}

- (void)sendResultForPreference:(NSString*)preferenceName command:(CAPPluginCall *)call {
    NSString* preferenceValue = ((CDVViewController *)self.viewController).settings[preferenceName];
    // length of NIL is zero
    if ([preferenceValue length] > 0) {
        [call resolve: preferenceValue]; // TODO: should be { value: value };
    } else {
        [call reject: [NSString stringWithFormat:@"Could not find preference %@", preferenceName]];
    }
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)clearDeploymentsIfBinaryUpdated {
    // check if we have a deployed package
    CodePushPackageMetadata* deployedPackageMetadata = [CodePushPackageManager getCurrentPackageMetadata];
    if (deployedPackageMetadata) {
        NSString* deployedPackageNativeBuildTime = deployedPackageMetadata.nativeBuildTime;
        NSString* applicationBuildTime = [Utilities getApplicationTimestamp];

        NSString* deployedPackageVersion = deployedPackageMetadata.appVersion;
        NSString* applicationVersion = [Utilities getApplicationVersion];

        if (deployedPackageNativeBuildTime != nil && applicationBuildTime != nil &&
            deployedPackageVersion != nil && applicationVersion != nil) {
            if (![deployedPackageNativeBuildTime isEqualToString: applicationBuildTime] ||
                ![deployedPackageVersion isEqualToString: applicationVersion]) {
                // package version is incompatible with installed native version
                [CodePushPackageManager cleanDeployments];
                [CodePushPackageManager clearFailedUpdates];
                [CodePushPackageManager clearPendingInstall];
                [CodePushPackageManager clearInstallNeedsConfirmation];
                [CodePushPackageManager clearBinaryFirstRunFlag];
            }
        }
    }
}

- (void)navigateToLocalDeploymentIfExists {
    CodePushPackageMetadata* deployedPackageMetadata = [CodePushPackageManager getCurrentPackageMetadata];
    if (deployedPackageMetadata && deployedPackageMetadata.localPath) {
        [self redirectStartPageToURL: deployedPackageMetadata.localPath];
    }
}

- (void)pluginInitialize {
    // register for "on resume", "on pause" notifications
    [self clearDeploymentsIfBinaryUpdated];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationWillEnterForeground) name:UIApplicationWillEnterForegroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationWillResignActive) name:UIApplicationWillResignActiveNotification object:nil];
    InstallOptions* pendingInstall = [CodePushPackageManager getPendingInstall];
    if (!pendingInstall) {
        [self handleUnconfirmedInstall:NO];
    }

    [self navigateToLocalDeploymentIfExists];
    // handle both ON_NEXT_RESUME and ON_NEXT_RESTART - the application might have been killed after transitioning to the background
    if (pendingInstall && (pendingInstall.installMode == ON_NEXT_RESTART || pendingInstall.installMode == ON_NEXT_RESUME)) {
        [self markUpdate];
        [CodePushPackageManager clearPendingInstall];
    }
}

- (void)applicationWillEnterForeground {
    InstallOptions* pendingInstall = [CodePushPackageManager getPendingInstall];
    // calculate the duration that the app was in the background
    long durationInBackground = lastResignedDate ? [[NSDate date] timeIntervalSinceDate:lastResignedDate] : 0;
    if (pendingInstall && pendingInstall.installMode == ON_NEXT_RESUME && durationInBackground >= pendingInstall.minimumBackgroundDuration) {
        CodePushPackageMetadata* deployedPackageMetadata = [CodePushPackageManager getCurrentPackageMetadata];
        if (deployedPackageMetadata && deployedPackageMetadata.localPath) {
            bool applied = [self loadPackage: deployedPackageMetadata.localPath];
            if (applied) {
                [self markUpdate];
                [CodePushPackageManager clearPendingInstall];
            }
        }
    } else if ([CodePushReportingManager hasFailedReport]) {
        [CodePushReportingManager reportStatus:[CodePushReportingManager getAndClearFailedReport] withWebView:self.webView];
    }
}

- (void)applicationWillResignActive {
    // Save the current time so that when the app is later resumed, we can detect how long it was in the background
    lastResignedDate = [NSDate date];
}

- (BOOL)loadPackage:(NSString*)packageLocation {
    NSURL* URL = [self getStartPageURLForLocalPackage:packageLocation];
    if (URL) {
        [self loadURL:URL];
        return YES;
    }

    return NO;
}

- (void)loadURL:(NSURL*)url {
    [self.webViewEngine loadRequest:[NSURLRequest requestWithURL:url]];
}

+ (NSString*) getCurrentServerBasePath {
    return specifiedServerPath;
}

+ (void) setServerBasePath:(NSString*)serverPath webView:(WKWebView *) webViewEngine {
    specifiedServerPath = serverPath;
    SEL setServerBasePath = NSSelectorFromString(@"setServerBasePath:");
    NSMutableArray * urlPathComponents = [serverPath pathComponents].mutableCopy;
    [urlPathComponents removeLastObject];
    NSString * serverBasePath = [urlPathComponents componentsJoinedByString:@"/"];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    CDVInvokedUrlCommand * command = [CDVInvokedUrlCommand commandFromJson:[NSArray arrayWithObjects: @"", @"", @"", [NSMutableArray arrayWithObject:serverBasePath], nil]];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webViewEngine performSelector: setServerBasePath withObject: command];
    });
#pragma clang diagnostic pop
}

- (void)loadStoreVersion {
    NSString* mainBundlePath = [[NSBundle mainBundle] bundlePath];
    NSString* configStartPage = [self getConfigLaunchUrl];
    NSArray* realLocationArray = @[mainBundlePath, @"www", configStartPage];
    NSString* mainPageLocation = [NSString pathWithComponents:realLocationArray];
    if ([[NSFileManager defaultManager] fileExistsAtPath:mainPageLocation]) {
        NSURL* mainPagePath = [NSURL fileURLWithPath:mainPageLocation];
        [self loadURL:mainPagePath];
    }
}

- (NSString*)getConfigLaunchUrl
{
    CDVConfigParser* delegate = [[CDVConfigParser alloc] init];
    NSString* configPath = [[NSBundle mainBundle] pathForResource:@"config" ofType:@"xml"];
    NSURL* configUrl = [NSURL fileURLWithPath:configPath];

    NSXMLParser* configParser = [[NSXMLParser alloc] initWithContentsOfURL:configUrl];
    [configParser setDelegate:((id < NSXMLParserDelegate >)delegate)];
    [configParser parse];

    return delegate.startPage;
}

- (NSURL *)getStartPageURLForLocalPackage:(NSString*)packageLocation {
    if (packageLocation) {
        NSString* startPage = [self getConfigLaunchUrl];
        NSString* libraryLocation = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) objectAtIndex:0];
        NSArray* realLocationArray = @[libraryLocation, @"NoCloud", packageLocation, @"www", startPage];
        NSString* realStartPageLocation = [NSString pathWithComponents:realLocationArray];
        if ([[NSFileManager defaultManager] fileExistsAtPath:realStartPageLocation]) {
            // Fixes WKWebView unable to load start page from CodePush update directory
            NSString* scheme = [self getAppScheme];
            if ([Utilities CDVWebViewEngineAvailable] && ([realStartPageLocation hasPrefix:@"/_app_file_"] == NO) && !([scheme isEqualToString: @"file"] || scheme == nil)) {
                realStartPageLocation = [@"/_app_file_" stringByAppendingString:realStartPageLocation];
            }
            return [NSURL fileURLWithPath:realStartPageLocation];
        }
    }

    return nil;
}

- (void)redirectStartPageToURL:(NSString*)packageLocation{
    NSURL* URL = [self getStartPageURLForLocalPackage:packageLocation];
    if (URL) {
        [CodePush setServerBasePath:URL.path webView:self.webViewEngine];
    }
}

- (void)isFailedUpdate:(CAPPluginCall *)call {
    NSString* packageHash = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    if (nil == packageHash) {
        [call reject: @"Invalid package hash parameter."];
    }
    else {
        BOOL failedHash = [CodePushPackageManager isFailedHash:packageHash];
        [call resolve: failedHash ? 1 : 0];
    }
}

- (void)isFirstRun:(CAPPluginCall *)call {
    BOOL isFirstRun = NO;

    NSString* packageHash = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    CodePushPackageMetadata* currentPackageMetadata = [CodePushPackageManager getCurrentPackageMetadata];
    if (currentPackageMetadata) {
        isFirstRun = (nil != packageHash
                        && [packageHash length] > 0
                        && [packageHash isEqualToString:currentPackageMetadata.packageHash]
                        && didUpdate);
    }

    [call resolve: isFirstRun ? 1 : 0];
}

- (void)isPendingUpdate:(CAPPluginCall *)call {
    InstallOptions* pendingInstall = [CodePushPackageManager getPendingInstall];
    [call resolve: pendingInstall ? 1 : 0];
}

- (void)getAppVersion:(CAPPluginCall *)call {
    NSString* version = [Utilities getApplicationVersion];
    [call resolve: version];
}

- (NSString*)getAppScheme {
    NSDictionary* settings = self.commandDelegate.settings;
    // Cordova
    NSString *scheme = [settings cordovaSettingForKey:@"scheme"];
    if (scheme != nil) {
        return scheme;
    }
    // Ionic
    scheme = [settings cordovaSettingForKey:@"iosScheme"];
    return scheme;
}

@end

