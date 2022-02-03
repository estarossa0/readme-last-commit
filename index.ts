import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import { readFile, writeFile } from 'fs/promises';

type CommitInfoData = {
  message: string;
  repo: string;
  sha: string;
};

interface CommitInfo {
  data?: CommitInfoData;
  error?: {
    type: 404 | 500;
  };
}

/**
 * Fetch the user events, look for the `pushEvent` type and return
 * object with information about the commit
 * @param username: the github user username
 */
const getCommitInfo = async (username: string): Promise<CommitInfo> => {
  const github = new Octokit({});

  core.notice(`Fetching ${username} public events`);

  const data = await github.activity
    .listPublicEventsForUser({ username: username, per_page: 100 })
    .then(({ data }) => data)
    .catch(({ response }) => {
      if (response?.status === 404) core.setFailed('User not found');
      else
        core.setFailed(
          `Failed with ${
            response?.status ? response?.status : 'undefined error'
          }`
        );
      return null;
    });

  if (!data) return { error: { type: 500 } };

  const pushEvent = data.find((event) => {
    if (event.type === 'PushEvent') {
      const payload = event.payload as any;
      if (!payload.commits || payload.commits.length === 0) return false;

      return true;
    }
    return false;
  });

  if (!pushEvent) {
    core.setFailed('Could not find any recent commits');
    return { error: { type: 404 } };
  }
  const payload = pushEvent.payload as any;

  return {
    data: {
      message: payload.commits[0].message,
      repo: pushEvent.repo.name,
      sha: payload.commits[0].sha,
    },
  };
};

/**
 * create the line that will be added in README and return it as string
 * @param data: object with data about the commit
 */
const assembleTheNewLine = (data: CommitInfoData): string => {
  const truncMessage =
    data.message.length > 50
      ? data.message.slice(0, 45).concat('...')
      : data.message;

  return `${truncMessage} ${data.repo}@${data.sha}`;
};

/**
 * open and parse the README file, then replace the commit line with latest one
 * @param line: the new commit line
 */
const updateReadmeFile = async (line: string): Promise<boolean> => {
  core.notice(`Reading README.md`);
  const readmeFile = await readFile('./README.md', 'utf-8').catch((error) => {
    if (error.code === 'ENOENT')
      core.setFailed("This repository doesn't have README.md");
    else core.setFailed(`Failed to read README.md, error: ${error.code}`);
    return null;
  });
  if (!readmeFile) return false;

  const readmeFileLines = readmeFile.split('\n');

  let startI = readmeFileLines.findIndex(
    (content) => content.trim() === '<!-- LATESTCOMMIT:START -->'
  );

  let endI = readmeFileLines.findIndex(
    (content) => content.trim() === '<!-- LATESTCOMMIT:END -->'
  );

  if (startI === -1 || endI === -1) {
    core.setFailed(
      `Could not found \`<!-- LATESTCOMMIT:${
        startI === -1 ? 'START' : 'END'
      } -->\` in file`
    );
    return false;
  }

  readmeFileLines.splice(
    startI + 1,
    startI + 1 === endI ? 0 : endI - startI - 1,
    line
  );

  const newFile = readmeFileLines.join('\n');

  if (newFile === readmeFile) {
    core.warning('No new commits nothing changed, not commits been done');
    return false;
  }

  await writeFile('./README.md', newFile);
  core.notice('Updated README');

  return true;
};

async function run() {
  const username = core.getInput('GH_USERNAME');

  if (!username) {
    core.setFailed('Username could not be found');
    return;
  }

  const { data, error } = await getCommitInfo(username);
  if (error || !data) return;

  const newLine = assembleTheNewLine(data);
  core.notice(`Found commit in ${data.repo}`);

  const updated = await updateReadmeFile(newLine);
}
run();
