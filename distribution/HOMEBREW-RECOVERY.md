# Repair the previous tap migration

Switching an existing tap from homebrew-nightfall to the main repository gave
Homebrew unrelated Git histories. Auto-update rebased the old cask onto the new
one and left conflict markers. The release archive and its checksum are fine.

Run on the affected Mac:

```sh
git -C "$(brew --repository romeirofernandes/nightfall)" rebase --abort || true
brew update-reset "$(brew --repository romeirofernandes/nightfall)"
brew install --cask romeirofernandes/nightfall/nightfall
```

The reset targets only the Nightfall tap and discards its local Git changes.
It does not reset other taps, uninstall applications, or remove preferences.
A message saying no rebase is in progress on the first line is harmless.
If Nightfall is already installed, Homebrew may report it is up to date.

New installation commands reset the tap after changing its remote to avoid this
migration conflict. The Homebrew workflow reproduces unrelated cask histories,
checks recovery, validates Ruby syntax, and installs the app on both Mac CPUs.

Reference: https://docs.brew.sh/Manpage#update-reset-repository-
