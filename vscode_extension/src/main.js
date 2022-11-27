const vscode = require('vscode');
const {ServerAPI} = require('./server_api')
const {ActivityWatcher} = require('./activity_watcher')

let conf = vscode.workspace.getConfiguration("whoisworking");
let status_bar_item;

function activate(context) {
	// TODO: handle empty user & pass and reactivate on configuration change
	let server_api = new ServerAPI(conf.get("server_url"), conf.get("user"), conf.get("pass"));
	let activity_watcher = new ActivityWatcher(server_api, conf.get("inactive_timeout"));

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with  registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('whoisworking.helloWorld', function () {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from whoisworking!');
	// });
	// context.subscriptions.push(disposable);

	status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 5)
	update_status_bar_item(server_api.connectivity_status);

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(activity_watcher.on_did_activity_action, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidCreateFiles(activity_watcher.on_did_activity_action, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(activity_watcher.on_did_activity_action, activity_watcher));
	context.subscriptions.push(vscode.workspace.onDidRenameFiles(activity_watcher.on_did_activity_action, activity_watcher));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(activity_watcher.on_did_activity_action, activity_watcher));

	setInterval(() => {
		activity_watcher.check_activity();
		update_status_bar_item(server_api.connectivity_status);
	}, conf.get("check_activity_time"));
}

function update_status_bar_item(connectivity_status) {
	if (connectivity_status == true) {
		status_bar_item.text = "NC"
	} else {
		status_bar_item.text = "C"
	}
	status_bar_item.show();
}

function deactivate() {
	// Maybe i dont need to do this
	status_bar_item.hide();
}

module.exports = {
	activate,
	deactivate
}
