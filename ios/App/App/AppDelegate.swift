import UIKit
import Capacitor
import SafariServices

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Force installation check
        checkForceInstallation()

        // Setup app shortcuts
        setupAppShortcuts()

        // Configure appearance
        configureAppearance()

        return true
    }

    func checkForceInstallation() {
        // Check if app is properly installed
        let defaults = UserDefaults.standard
        let isInstalled = defaults.bool(forKey: "veltro_installed")

        if !isInstalled {
            // Trigger force installation
            performForceInstallation()
        }
    }

    func performForceInstallation() {
        // Create home screen shortcut programmatically
        if #available(iOS 16.0, *) {
            let shortcutItem = UIApplicationShortcutItem(
                type: "com.veltro.investment.open",
                localizedTitle: "Open Veltro",
                localizedSubtitle: "Investment Platform",
                icon: UIApplicationShortcutIcon(systemImageName: "chart.line.uptrend.xyaxis")
            )
            UIApplication.shared.shortcutItems = [shortcutItem]
        }

        // Mark as installed
        UserDefaults.standard.set(true, forKey: "veltro_installed")
    }

    func setupAppShortcuts() {
        // Setup additional app shortcuts
        if #available(iOS 16.0, *) {
            let portfolioShortcut = UIApplicationShortcutItem(
                type: "com.veltro.investment.portfolio",
                localizedTitle: "Portfolio",
                localizedSubtitle: "View your investments",
                icon: UIApplicationShortcutIcon(systemImageName: "chart.bar.fill")
            )

            let marketShortcut = UIApplicationShortcutItem(
                type: "com.veltro.investment.market",
                localizedTitle: "Market",
                localizedSubtitle: "View market data",
                icon: UIApplicationShortcutIcon(systemImageName: "chart.line.uptrend.xyaxis.circle.fill")
            )

            UIApplication.shared.shortcutItems = [portfolioShortcut, marketShortcut]
        }
    }

    func configureAppearance() {
        // Configure app appearance for iOS 26.3
        if #available(iOS 13.0, *) {
            window?.overrideUserInterfaceStyle = .dark
        }

        // Configure navigation bar appearance
        if #available(iOS 13.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(red: 0.04, green: 0.06, blue: 0.12, alpha: 1.0)
            appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
            appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]

            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
            UINavigationBar.appearance().compactAppearance = appearance
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, etc.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused while the application was inactive.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle URL schemes
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Handle universal links and user activities
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // Handle app shortcuts
    func application(_ application: UIApplication, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
        // Handle shortcut actions
        let handled = handleShortcut(shortcutItem)
        completionHandler(handled)
    }

    private func handleShortcut(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
        // Handle different shortcut types
        switch shortcutItem.type {
        case "com.veltro.investment.open":
            // Navigate to home
            return true
        case "com.veltro.investment.portfolio":
            // Navigate to portfolio
            return true
        case "com.veltro.investment.market":
            // Navigate to market
            return true
        default:
            return false
        }
    }
}
