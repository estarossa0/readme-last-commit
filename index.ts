import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

interface CommitInfo {
  data?: {
    message: string;
    repo: string;
    sha: string;
  };
  error?: {
    type: 404 | 500;
  };
}

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

async function run() {
  const username = core.getInput('GH_USERNAME');

  if (!username) {
    core.setFailed('Username could not be found');
    return;
  }

  const { data, error } = await getCommitInfo(username);
  if (error) return;

  console.log(data);
}
run();
