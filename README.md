# Readme latest commit

This action update a section of your `README.md` with a picture containing details about the latest commit you've made.

Example:

[<img width="380px" height="200px" src="https://opengraph.githubassets.com/96c96f7b7bac201983890fbd933fee9ce60a4abb89d31d9b9363a2ee3825a146/nextauthjs/next-auth/commit/5e803cd34c308021d742eb05015af76e2c7a0084"/>][commiturl]

[commiturl]: https://github.com/estarossa0/1337-reports/commit/7565510b562b58a7182ff1416b09d96668a8501b

## Instruction 📖

### 1. Add to your `README.md` file two lines that indicate where to put the commit picture:

    <!-- LATESTCOMMIT:START -->
    <!-- LATESTCOMMIT:END -->
    > (Anything between those two lines will be deleted and replaced with the commit picture)

### 2. Create a workflow file

In your repository create the following file:
`.github/workflows/last-commit.yml`

```yaml
name: Latest commit message made by user
on:
schedule:
# Runs every hour
- cron: '0 * * * *'

workflow_dispatch:

jobs:

update-readme-with-last-commit:

name: Update this repo's README with latest commit made

runs-on: ubuntu-latest

steps:

- uses: actions/checkout@v2

- uses: estarossa0/readme-last-commit@master
```

The action above runs every hours, you can change it as you like by changing `- cron` using [cron syntax](https://jasonet.co/posts/scheduled-actions/#the-cron-syntax).

> 💡 The action only check for your public commits, no private commits will be displayed.

---

\_Inspired by [jamesgeorge007/github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme)<br/>
\_motivated by [codeSTACKr](https://github.com/codeSTACKr) youtube [video](https://www.youtube.com/watch?v=ECuqb5Tv9qI&t) about GitHub readme
