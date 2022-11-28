const vscode = require('vscode');
const {ServerAPI} = require('./server_api')
const {ActivityWatcher} = require('./activity_watcher')

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
		activity_watcher.add_inactive_delay(-(conf.get("checkActivityTime")*1000)).then((inactive_delay) => {
			if (inactive_delay > 0) {
				activity_watcher.on_did_activity_action();
			}
			update_status_bar_item(inactive_delay);
			activity_watcher.check_activity();
		});
	}, conf.get("checkActivityTime")*1000);
}

function update_configuration(event) {
	conf = vscode.workspace.getConfiguration("whoisworking");
	if (event.affectsConfiguration("whoisworking.checkActivityTime")){
		update_activity_check_interval();
	}
	if (event.affectsConfiguration("whoisworking.inactiveTimeout")){
		activity_watcher.set_inactive_timeout(conf.get("inactiveTimeout")*1000);
	}
	if (event.affectsConfiguration("whoisworking.serverUrl")){
		server_api.set_server_url(conf.get("serverUrl"));
	}
	if (event.affectsConfiguration("whoisworking.username") || event.affectsConfiguration("whoisworking.password")){
		server_api.set_credentials(conf.get("username"), conf.get("password"));
	}
}

function activate(context) {
	server_api = new ServerAPI(conf.get("serverUrl"), conf.get("username"), conf.get("password"));
	activity_watcher = new ActivityWatcher(server_api, conf.get("inactiveTimeout")*1000);

	status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5)
	update_status_bar_item(server_api.connectivity_status);

	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.disable", () => {
		activity_watcher.disable();
		vscode.window.showInformationMessage("WhoIsWorking is disabled.");
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.enable", () => {
		activity_watcher.enable();
		vscode.window.showInformationMessage("WhoIsWorking is enabled.");
	}));
	context.subscriptions.push(vscode.commands.registerCommand("whoisworking.add_inactive_delay", () => {
		vscode.window.showInputBox({
			title: "Enter Delay in minutes"
		}).then((val) => {
			if (isNaN(Number(val))) {
				vscode.window.showErrorMessage("\"" + val + "\" is not a number");
				return;
			}
			activity_watcher.add_inactive_delay(Number(val)*60*1000).then((inactive_delay) => {
				vscode.window.showInformationMessage("For the next " + inactive_delay / 60 / 1000 + " minutes you appear as active.");
				update_status_bar_item(inactive_delay);
			});
		});
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {activity_watcher.on_did_activity_action()}, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidCreateFiles(() => {activity_watcher.on_did_activity_action()}, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(() => {activity_watcher.on_did_activity_action()}, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidRenameFiles(() => {activity_watcher.on_did_activity_action()}, activity_watcher));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {activity_watcher.on_did_activity_action()}, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(update_configuration));
	update_activity_check_interval();
}

function update_status_bar_item(inactive_delay) {
	status_bar_item.text = String(Math.ceil(inactive_delay/60/1000));
	status_bar_item.show();
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
