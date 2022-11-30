const vscode = require('vscode');
const { ServerAPI } = require('./server_api')
const { ActivityWatcher } = require('./activity_watcher')

let conf = vscode.workspace.getConfiguration("whoisworking");
let status_bar_item;
let activity_check_interval;
let activity_watcher;
let server_api;

function update_activity_check_interval() {
	if (activity_check_interval) {
		clearInterval(activity_check_interval);
	}
	activity_check_interval = setInterval(() => {
		activity_watcher.check_activity();
	}, conf.get("checkActivityTime") * 1000);
}

function update_configuration(event) {
	activity_watcher.on_did_activity_action();
	conf = vscode.workspace.getConfiguration("whoisworking");
	if (event.affectsConfiguration("whoisworking.enabled")) {
		activity_watcher.set_enabled(conf.get("enabled"));
		update_status_bar_item();
	}
	if (event.affectsConfiguration("whoisworking.checkActivityTime")) {
		update_activity_check_interval();
	}
	if (event.affectsConfiguration("whoisworking.inactiveTimeout")) {
		activity_watcher.set_inactive_timeout(conf.get("inactiveTimeout") * 1000);
	}
	if (event.affectsConfiguration("whoisworking.serverUrl")) {
		server_api.set_server_url(conf.get("serverUrl"));
	}
	if (event.affectsConfiguration("whoisworking.username") || event.affectsConfiguration("whoisworking.password")) {
		server_api.set_credentials(conf.get("username"), conf.get("password"));
	}
}

function activate(context) {
	server_api = new ServerAPI(conf.get("serverUrl"), conf.get("username"), conf.get("password"));
	activity_watcher = new ActivityWatcher(server_api, conf.get("inactiveTimeout") * 1000);
	activity_watcher.set_enabled(conf.get("enabled"));

	status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5)
	status_bar_item.command = "whoisworking.toggle";
	update_status_bar_item();

	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.toggle", () => {
		activity_watcher.on_did_activity_action().then(() => {
			conf.update("enabled", !conf.get("enabled"), true);
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.disable", () => {
		activity_watcher.on_did_activity_action().then(() => {
			conf.update("enabled", false, true).then(() => {
				vscode.window.showInformationMessage("WhoIsWorking is disabled.");
			});
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.enable", () => {
		activity_watcher.on_did_activity_action().then(() => {
			conf.update("enabled", true, true).then(() => {
				vscode.window.showInformationMessage("WhoIsWorking is enabled.");
			});
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.set_message", () => {
		vscode.window.showInputBox({
			title: "Enter Message"
		}).then((val) => {
			activity_watcher.on_did_activity_action().then(() => {
				activity_watcher.set_message(val).then(() => {
					activity_watcher.check_activity().then(() => {
						vscode.window.showInformationMessage("Message set successfully.");
					});
				});
			});
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.clear_message", () => {
		activity_watcher.on_did_activity_action().then(() => {
			activity_watcher.set_message("").then(() => {
				activity_watcher.check_activity().then(() => {
					vscode.window.showInformationMessage("Message cleared.");
				});
			});
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.start_break", () => {
		vscode.window.showInputBox({
			title: "Enter Break Time in minutes"
		}).then((val) => {
			if (isNaN(Number(val))) {
				vscode.window.showErrorMessage("\"" + val + "\" is not a number");
				return;
			}
			let break_time = Date.now() + (Number(val) * 60 * 1000);
			activity_watcher.on_did_activity_action().then(() => {
				activity_watcher.set_break_time(break_time).then(() => {
					activity_watcher.check_activity().then(() => {
						vscode.window.showInformationMessage("Break started.");
					});
				})
			});
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.stop_break", () => {
		activity_watcher.on_did_activity_action().then(() => {
			activity_watcher.set_break_time(Date.now()).then(() => {
				activity_watcher.check_activity().then(() => {
					vscode.window.showInformationMessage("Break stopped.");
				});
			});
		});
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => { activity_watcher.on_did_activity_action() }, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidCreateFiles(() => { activity_watcher.on_did_activity_action() }, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(() => { activity_watcher.on_did_activity_action() }, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidRenameFiles(() => { activity_watcher.on_did_activity_action() }, activity_watcher));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => { activity_watcher.on_did_activity_action() }, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(update_configuration));
	update_activity_check_interval();
}

function update_status_bar_item() {
	if (conf.get("enabled")) {
		status_bar_item.text = "$(cloud-upload)";
		status_bar_item.tooltip = "Disable WhoIsWorking";
	} else {
		status_bar_item.text = "$(cloud)";
		status_bar_item.tooltip = "Enable WhoIsWorking";
	}
	status_bar_item.show();
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
