import * as core from '@actions/core';
import * as fs from 'fs';
import {Changelog} from './Changelog';
import {info, success, error, br} from '../src/Output';

async function run(): Promise<void> {
    try {
        process.env['GITHUB_AUTH'] = core.getInput('GITHUB_AUTH');
        const labelSettingsFilePath = core.getInput('label_settings_file_path');
        const tagFrom = core.getInput('tag_from');
        const tagTo = core.getInput('tag_to');
        const releaseTitle = core.getInput('release_title');
        const removeTitleLine =
            core.getInput('remove_title_line').toLowerCase() === 'true';

        const labelSettings = JSON.parse(
            fs.readFileSync(labelSettingsFilePath, 'utf8')
        );
        const changelog = new Changelog(labelSettings);

        if (releaseTitle !== undefined && releaseTitle === '') {
            changelog.nextVersion = releaseTitle;
        }

        changelog.repo = process.env.GITHUB_REPOSITORY ?? '';
        let markdown = await changelog.generate(tagFrom, tagTo);

        if (removeTitleLine) {
            markdown = markdown.substr(
                markdown.indexOf(
                    '\n',
                    markdown.indexOf('\n', markdown.indexOf('\n', 0) + 1) + 1
                ) + 1
            );
        }

        if (markdown.length === 0) {
            error(
                'The changelog was not generated. Please check the label settings and whether the pull requests have been merged.'
            );
        } else {
            success('Changelog has been generated.');
            info(markdown);
        }
        br();

        core.setOutput('markdown', markdown);
    } catch (e) {
        core.setFailed(e.message);
    }
}

run();
