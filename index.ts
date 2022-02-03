import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

async function run() {
  const github = new Octokit({});
  const username = core.getInput('GH_USERNAME');

  console.log(username);
  const data = await github.activity
    .listPublicEventsForUser({ username: username, per_page: 5 })
    .then(({ data }) => data);

  console.log(data);
}
run();
