# upload-asset

Upload an asset to the current GitHub release in a GitHub Actions CI environment with variable name. Useful when deploying from a job matrix.

## Example

```yaml
name: Upload prebuild binaries
on:
  release:
    types: [published]

jobs:
  nightly:
    name: Upload release binaries
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macOS-latest]
    runs-on: ${{ matrix.os }}
    steps:
      ... # build your asset first

      - name: Deploy Windows release
        if: matrix.os == 'windows-latest'
        uses: WebFreak001/upload-asset@v1.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # automatically provided by github actions
          OS: windows # just a variable we use in the name pattern
        with:
          file: ./myapp.zip # path to archive to upload
          mime: application/zip # required by GitHub API
          name: 'myapp_${OS}-${TAG}.zip' # name pattern to upload the release as
```

## Pattern variables

For the `name` field you can use environment variables as pattern. Variables must be in form `${name}` inside the value. You can also substring using `${name:start}`, `${name::maxlength}` or `${name:start:length}` like `${GITHUB_SHA::7}` to get the first 7 characters of the commit hash.

Additionally to environment variables passed in by the user or by github there are the following built-in variables:

- `TAG` the tag name that was released, stripped of a starting `v` character
- `TAG_RAW` the tag name that was released, raw
- `COMMITISH` the target_commitish according to [GitHub API](https://developer.github.com/v3/repos/releases/#get-a-single-release)
- `RELEASE_NAME` the release name (often, but not neccesarily equal to `TAG_RAW`)
- `YEAR` the current 4 digit year (UTC)
- `MONTH` the current 2 digit month (UTC)
- `DAY` the current 2 digit day-of-the-month (UTC)
