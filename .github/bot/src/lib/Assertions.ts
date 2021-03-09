import { context, getOctokit } from "@actions/github";
import { EVENTS, GITHUB_TOKEN } from "src/utils";
import { FileDiff } from "./GetFileDiff";

export const assertEvent = () => {
  const event = context.eventName;

  if (event !== EVENTS.pullRequest) {
    throw `Only events of type ${EVENTS.pullRequest} are allowed`;
  }

  return event;
};

export const assertPullNumber = () => {
  const payload = context.payload;

  if (!payload.pull_request?.number) {
    throw "Build does not have a PR number associated with it; quitting...";
  }

  return payload.pull_request.number;
};

export const assertPr = async () => {
  const Github = getOctokit(GITHUB_TOKEN);

  const prNum = assertPullNumber();
  const { data: pr } = await Github.pulls.get({
    repo: context.repo.repo,
    owner: context.repo.owner,
    pull_number: prNum
  });

  if (pr.merged) {
    throw `PR ${prNum} is already merged; quitting`;
  }

  // if (pr.mergeable_state != "clean") {
  //   throw `PR ${prNum} mergeable state is ${pr.mergeable_state}; quitting`;
  // }

  return pr;
};

export const assertAuthors = (file: FileDiff) => {
  // take from base to avoid people adding themselves and being able to approve
  const authors = file.base.authors && [...file.base.authors];

  // Make sure there are authors
  if (!authors || authors.length === 0) {
    throw `${file.head.name} has no identifiable authors who can approve the PR (only considering the base version)`;
  }

  return authors;
};