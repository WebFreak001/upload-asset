/**
 * This file is licensed under the MIT License.
 */

const core = require("@actions/core");
const { GitHub } = require("@actions/github");
const fs = require("fs");

async function uploadAsset(github, url, file, name, mime) {
	const contentLength = filePath => fs.statSync(filePath).size;

	const headers = { 'content-type': mime, 'content-length': contentLength(file) };

	const uploadAssetResponse = await github.repos.uploadReleaseAsset({
		url,
		headers,
		name,
		file: fs.readFileSync(file)
	});

	return uploadAssetResponse.data.browser_download_url;
}

async function run() {
	try {
		let event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
		if (!event || !event.release) {
			core.setFailed("This is not a release event");
			return;
		}

		const file = core.getInput("file", { required: true });
		const mime = core.getInput("mime", { required: true });
		const pattern = core.getInput("pattern", { required: false });

		const github = new GitHub(process.env.GITHUB_TOKEN);

		const url = event.release.upload_url;

		process.env.TAG_RAW = event.release.tag_name;
		process.env.TAG = event.release.tag_name.startsWith("v") ? event.release.tag_name.substr(1) : event.release.tag_name;
		process.env.COMMITISH = event.release.target_commitish;
		process.env.RELEASE_NAME = event.release.name;
		process.env.YEAR = new Date().getUTCFullYear().toString();
		process.env.MONTH = pad2((new Date().getUTCMonth() + 1).toString());
		process.env.DAY = pad2(new Date().getUTCDate().toString());

		process.env.GITHUB_TOKEN = ""; // let's blank this just in case

		const name = pattern ? formatPattern(pattern, process.env) : file;

		const ret = await uploadAsset(github, url, file, name, mime);

		core.setOutput("url", ret);
	} catch (error) {
		core.setFailed(error.message);
	}
}

function formatPattern(pattern, variables) {
	let ret = pattern;
	let start = 0;
	while (true) {
		let variable = ret.indexOf('${', start);
		if (variable == -1)
			break;
		let end = ret.indexOf('}', variable + 2);
		if (end == -1)
			break;

		const match = ret.substring(variable + 2, end);
		const value = formatVariable(match, variables);
		start = variable + value.length;
		ret = ret.substr(0, variable) + value + ret.substr(end + 1);
	}
	return ret;
}

function formatVariable(match, variables) {
	let value = variables[match];

	if (value) {
		value = value.toString();
		let subStart = match.indexOf(':');
		if (subStart != -1) {
			let subEnd = match.indexOf(':', subStart + 1);
			if (subEnd != -1) {
				let subStartStr = match.substring(subStart + 1, subEnd);
				let subStartIndex = subStartStr ? parseInt(subStartStr) : 0;
				let subEndStr = match.substring(subEnd + 1);
				let subEndIndex = subEndStr ? parseInt(subEndStr) : value.length;
				value = value.substring(subStartIndex, subEndIndex);
			} else {
				value = value.substr(parseInt(match.substr(subStart + 1)) || 0);
			}
		}
	} else {
		value = '';
	}

	return value;
}

function pad2(v) {
	v = v.toString();
	while (v.length < 2) v = "0" + v;
	return v;
}

run();
