const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const PACKAGE_PATH = path.join(__dirname, '..', 'package.json');

// 获取当前版本
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
const version = packageJson.version;

// 获取今天的日期 YYYY-MM-DD
const date = new Date().toISOString().split('T')[0];

function getCommits() {
  try {
    // 获取上一个 tag
    let lastTag = '';
    try {
      lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
    } catch (e) {
      // 如果没有 tag，可能是一个新仓库，或者没有 tags
      console.log('No tags found, getting all commits.');
    }

    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const log = execSync(`git log ${range} --pretty=format:"%s" --no-merges`).toString();
    return log.split('\n').filter(line => line.trim());
  } catch (e) {
    console.error('Failed to get git log:', e);
    return [];
  }
}

function parseCommits(commits) {
  const groups = {
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    docs: [],
    other: []
  };

  commits.forEach(msg => {
    const match = msg.match(/^(\w+)(?:\((.*?)\))?:\s*(.+)$/);
    if (match) {
      const type = match[1];
      const scope = match[2] ? `**${match[2]}:** ` : '';
      const subject = match[3];
      const line = `- ${scope}${subject}`;

      if (groups[type]) {
        groups[type].push(line);
      } else {
        groups.other.push(`- ${type}: ${subject}`);
      }
    } else {
      groups.other.push(`- ${msg}`);
    }
  });

  return groups;
}

function generateChangelogEntry(version, date, groups) {
  let entry = `## [${version}] - ${date}\n\n`;

  if (groups.feat.length) {
    entry += `### ✨ Features\n\n${groups.feat.join('\n')}\n\n`;
  }
  if (groups.fix.length) {
    entry += `### 🐛 Bug Fixes\n\n${groups.fix.join('\n')}\n\n`;
  }
  if (groups.perf.length) {
    entry += `### ⚡ Performance\n\n${groups.perf.join('\n')}\n\n`;
  }
  if (groups.refactor.length) {
    entry += `### ♻️ Refactor\n\n${groups.refactor.join('\n')}\n\n`;
  }
  if (groups.docs.length) {
    entry += `### 📝 Documentation\n\n${groups.docs.join('\n')}\n\n`;
  }
  
  // 仅当没有其他主要变更时才显示 other，或者你可以选择总是显示
  // 这里为了保持简洁，如果有 major categories，可能忽略 other，或者放在最后
  // if (groups.other.length) {
  //   entry += `### 🔨 Other Changes\n\n${groups.other.join('\n')}\n\n`;
  // }

  return entry;
}

function updateChangelog() {
  const commits = getCommits();
  if (commits.length === 0) {
    console.log('No new commits found.');
    return;
  }

  const groups = parseCommits(commits);
  
  // 检查是否只有 docs 或 other，如果是，可能不想发布新版本日志？
  // 但既然用户要求“发布前更新”，我们假设版本号已经升了，所以必须生成日志。

  const newEntry = generateChangelogEntry(version, date, groups);
  
  let currentContent = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    currentContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } else {
    currentContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }

  // 检查当前版本是否已经存在于日志中（避免重复运行脚本导致重复添加）
  if (currentContent.includes(`## [${version}]`)) {
    console.log(`Changelog for version ${version} already exists. Skipping.`);
    // 可选：如果需要覆盖，可以加逻辑处理，这里简单跳过
    return;
  }

  // 插入新日志到头部（在标题之后）
  // 假设文件头是 "# Changelog..." 
  // 我们查找第一个 "## [" 或者直接插在第4行（如果有header）
  
  let newContent = '';
  const headerMatch = currentContent.match(/^# Changelog.*?\n\n/s);
  
  if (headerMatch) {
    const header = headerMatch[0];
    const rest = currentContent.slice(header.length);
    newContent = header + newEntry + rest;
  } else {
    // 如果没有标准头，直接插在最前面
    newContent = '# Changelog\n\n' + newEntry + currentContent;
  }

  fs.writeFileSync(CHANGELOG_PATH, newContent, 'utf8');
  console.log(`CHANGELOG.md updated for version ${version}`);
}

updateChangelog();
